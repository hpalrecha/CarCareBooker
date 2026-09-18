/**
 * Auto-deploy and disk cleanup, exercised for real.
 *
 * Both scripts are run by bash in a sandbox whose PATH provides fake `git`, `docker`
 * and `flock`, so every branch is executed — no pattern-matching of the source. The
 * fakes record what they were asked to do, which is what the assertions check.
 *
 * The rules that matter, and why:
 *   - deploy only when origin/main differs from the SHA the running container was built
 *     from (a rebuild is ~30 minutes of CPU on a small host);
 *   - never deploy a commit that already failed, or the timer rebuilds a broken commit
 *     every few minutes forever;
 *   - a disable file stops it immediately, without uninstalling anything;
 *   - cleanup never removes the live image or the newest rollback target.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUTO = path.join(repoRoot, 'scripts/auto-deploy.sh');
const GC = path.join(repoRoot, 'scripts/deploy-gc.sh');

/** A sandbox with fake git/docker/flock on PATH. */
function sandbox({ target, running, deployExit = 0, prevs = [], images = [], disabled = false, failed = null }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p91-auto-'));
  const bin = path.join(dir, 'bin');
  const state = path.join(dir, 'state');
  const repo = path.join(dir, 'repo');
  const calls = path.join(dir, 'calls.log');
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(path.join(repo, '.git'), { recursive: true });
  fs.mkdirSync(state, { recursive: true });
  fs.writeFileSync(calls, '');
  if (disabled) fs.writeFileSync(path.join(state, 'auto-deploy.disabled'), '');
  if (failed) fs.writeFileSync(path.join(state, 'auto-deploy.failed'), failed);

  const sh = (name, body) => {
    const p = path.join(bin, name);
    fs.writeFileSync(p, `#!/usr/bin/env bash\n${body}\n`, { mode: 0o755 });
  };

  // The deploy and gc scripts that `git show` hands back: they only record their args.
  const deployStub = `#!/usr/bin/env bash\necho "DEPLOY $*" >> ${JSON.stringify(calls)}\nexit ${deployExit}\n`;
  const gcStub = `#!/usr/bin/env bash\necho "GC $*" >> ${JSON.stringify(calls)}\nexit 0\n`;

  sh('git', `
echo "GIT $*" >> ${JSON.stringify(calls)}
args=("$@"); cmd=""
for ((i=0;i<\${#args[@]};i++)); do case "\${args[$i]}" in fetch|rev-parse|show) cmd="\${args[$i]}"; rest=("\${args[@]:$((i+1))}"); break;; esac; done
case "$cmd" in
  fetch) exit 0 ;;
  rev-parse) echo "${target}" ;;
  show) case "\${rest[0]}" in
          *scripts/deploy-manual.sh) cat <<'STUB'
${deployStub}STUB
          ;;
          *scripts/deploy-gc.sh) cat <<'STUB'
${gcStub}STUB
          ;;
          *) exit 1 ;;
        esac ;;
  *) exit 0 ;;
esac`);

  const prevLines = prevs.map((p) => p.name).join('\\n');
  const imageLines = images.map((i) => `${i.tag} ${i.size || '500MB'}`).join('\\n');
  const inspectCases = [
    running ? `carcarebooker) echo "carcarebooker:git-${running}" ;;` : `carcarebooker) exit 1 ;;`,
    ...prevs.map((p) => `${p.name}) echo "${p.image}" ;;`),
  ].join('\n    ');

  sh('docker', `
echo "DOCKER $*" >> ${JSON.stringify(calls)}
case "$1" in
  info) exit 0 ;;
  inspect)
    name="\${@: -1}"
    case "$name" in
    ${inspectCases}
    *) exit 1 ;;
    esac ;;
  ps) printf '%b\\n' "${prevLines}" | sed '/^$/d' ;;
  images) printf '%b\\n' "${imageLines}" | sed '/^$/d' ;;
  rm|rmi|builder|image) exit 0 ;;
  *) exit 0 ;;
esac`);

  sh('flock', 'exit 0'); // real flock is Linux-only; locking itself is not under test

  // GNU `install` cannot set 0700 under the Windows temp directory. The scripts use it
  // for directories and to copy the deploy script; here only that behaviour matters.
  sh('install', `
dirmode=0; paths=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d) dirmode=1; shift ;;
    -m) shift 2 ;;
    -*) shift ;;
    *) paths+=("$1"); shift ;;
  esac
done
if [[ "$dirmode" == "1" ]]; then mkdir -p "\${paths[@]}"; else cp "\${paths[0]}" "\${paths[1]}"; fi`);

  return { dir, bin, state, repo, calls, readCalls: () => fs.readFileSync(calls, 'utf8') };
}

function run(script, args, s, extraEnv = {}) {
  const env = {
    ...process.env,
    PATH: `${s.bin}${path.delimiter}${process.env.PATH}`,
    P91_REPO_DIR: s.repo,
    P91_DEPLOY_STATE_DIR: s.state,
    P91_AUTO_DEPLOY_LOG: path.join(s.dir, 'auto.log'),
    P91_PUBLIC_URL: 'https://p91carcare.com',
    ...extraEnv,
  };
  try {
    return { code: 0, out: execFileSync('bash', [script, ...args], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const SHA_NEW = 'a'.repeat(40);
const SHA_OLD = 'b'.repeat(40);

describe('auto-deploy decides correctly', () => {
  test('nothing to do when the running container is already origin/main', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_NEW });
    const r = run(AUTO, ['--execute'], s);
    assert.equal(r.code, 0);
    assert.match(r.out, /already deployed; nothing to do/);
    assert.doesNotMatch(s.readCalls(), /DEPLOY/, 'must not rebuild when nothing changed');
  });

  test('dry-run reports a new commit without deploying it', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD });
    const r = run(AUTO, [], s);
    assert.equal(r.code, 0);
    assert.match(r.out, /\[dry-run\] would deploy aaaaaaa/);
    assert.doesNotMatch(s.readCalls(), /DEPLOY/);
  });

  test('a new commit is deployed with the pinned SHA, then disk is reclaimed', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD });
    const r = run(AUTO, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    const calls = s.readCalls();
    assert.match(calls, new RegExp(`DEPLOY deploy ${SHA_NEW} --execute --repo `), 'full 40-char SHA, --execute');
    assert.match(calls, /--public-url https:\/\/p91carcare\.com/);
    assert.match(calls, /GC --execute/, 'cleanup runs after a successful deploy');
    assert.match(r.out, /deployed aaaaaaa/);
    assert.ok(!fs.existsSync(path.join(s.state, 'auto-deploy.failed')));
    assert.match(fs.readFileSync(path.join(s.dir, 'auto.log'), 'utf8'), /deployed aaaaaaa/, 'written to the log file too');
  });

  test('the deploy script comes from the commit being deployed, not the host checkout', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD });
    run(AUTO, ['--execute'], s);
    assert.match(s.readCalls(), new RegExp(`GIT -C .* show ${SHA_NEW}:scripts/deploy-manual\\.sh`));
  });

  test('a failed deploy is recorded and never retried automatically', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD, deployExit: 3 });
    const first = run(AUTO, ['--execute'], s);
    assert.equal(first.code, 3, 'the failure surfaces to systemd');
    assert.match(first.out, /deploy of aaaaaaa FAILED \(exit 3\)/);
    assert.equal(fs.readFileSync(path.join(s.state, 'auto-deploy.failed'), 'utf8'), SHA_NEW);
    assert.doesNotMatch(s.readCalls(), /GC --execute/, 'no cleanup after a failure');

    // Next tick: same commit, no second 30-minute rebuild.
    const s2 = sandbox({ target: SHA_NEW, running: SHA_OLD, failed: SHA_NEW });
    const second = run(AUTO, ['--execute'], s2);
    assert.equal(second.code, 0);
    assert.match(second.out, /will not be retried automatically/);
    assert.doesNotMatch(s2.readCalls(), /DEPLOY/);
  });

  test('a newer commit after a failure IS deployed', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD, failed: 'c'.repeat(40) });
    const r = run(AUTO, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    assert.match(s.readCalls(), /DEPLOY deploy/);
  });

  test('the disable file stops deploys without uninstalling anything', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD, disabled: true });
    const r = run(AUTO, ['--execute'], s);
    assert.equal(r.code, 0);
    assert.match(r.out, /disabled by .*auto-deploy\.disabled/);
    assert.doesNotMatch(s.readCalls(), /DEPLOY/);
  });
});

describe('disk cleanup keeps what a rollback needs', () => {
  const setup = (over = {}) =>
    sandbox({
      target: SHA_NEW,
      running: SHA_NEW,
      prevs: [
        { name: 'carcarebooker-prev-20260917T100000Z', image: `carcarebooker:git-${SHA_OLD}` },
        { name: 'carcarebooker-prev-20260901T100000Z', image: 'carcarebooker:git-' + 'd'.repeat(40) },
        { name: 'carcarebooker-prev-20260801T100000Z', image: 'carcarebooker:git-' + 'e'.repeat(40) },
      ],
      images: [
        { tag: `carcarebooker:git-${SHA_NEW}` },
        { tag: `carcarebooker:git-${SHA_OLD}` },
        { tag: 'carcarebooker:git-' + 'd'.repeat(40) },
        { tag: 'carcarebooker:git-' + 'e'.repeat(40) },
      ],
      ...over,
    });

  test('dry-run removes nothing', () => {
    const s = setup();
    const r = run(GC, [], s);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /MODE: DRY-RUN/);
    const calls = s.readCalls();
    assert.doesNotMatch(calls, /DOCKER rm /);
    assert.doesNotMatch(calls, /DOCKER rmi /);
  });

  test('keeps the live image and the newest rollback, removes the rest', () => {
    const s = setup();
    const r = run(GC, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    const calls = s.readCalls();
    // Live image and the newest rollback target survive.
    assert.doesNotMatch(calls, new RegExp(`DOCKER rmi carcarebooker:git-${SHA_NEW}`), 'live image must never be removed');
    assert.doesNotMatch(calls, new RegExp(`DOCKER rmi carcarebooker:git-${SHA_OLD}`), 'newest rollback image must survive');
    assert.doesNotMatch(calls, /DOCKER rm carcarebooker-prev-20260917T100000Z/, 'newest rollback container must survive');
    // Older ones go.
    assert.match(calls, /DOCKER rm carcarebooker-prev-20260901T100000Z/);
    assert.match(calls, /DOCKER rm carcarebooker-prev-20260801T100000Z/);
    assert.match(calls, new RegExp(`DOCKER rmi carcarebooker:git-${'d'.repeat(40)}`));
    assert.match(calls, new RegExp(`DOCKER rmi carcarebooker:git-${'e'.repeat(40)}`));
    // Build cache capped, not emptied: an empty cache means a full rebuild next time.
    assert.match(calls, /DOCKER builder prune -f --keep-storage 2GB/);
  });

  test('KEEP_PREV=2 keeps two rollback targets', () => {
    const s = setup();
    const r = run(GC, ['--execute'], s, { KEEP_PREV: '2' });
    assert.equal(r.code, 0, r.out);
    const calls = s.readCalls();
    assert.doesNotMatch(calls, /DOCKER rm carcarebooker-prev-20260901T100000Z/);
    assert.match(calls, /DOCKER rm carcarebooker-prev-20260801T100000Z/);
  });

  test('uploads backups: the newest are kept', () => {
    const s = setup();
    const backups = path.join(s.state, 'backups');
    for (const ts of ['20260801T0Z', '20260901T0Z', '20260910T0Z', '20260917T0Z']) {
      fs.mkdirSync(path.join(backups, ts), { recursive: true });
    }
    run(GC, ['--execute'], s, { KEEP_BACKUPS: '2' });
    const left = fs.readdirSync(backups).sort();
    assert.deepEqual(left, ['20260910T0Z', '20260917T0Z'], 'the two newest uploads backups survive');
  });
});
