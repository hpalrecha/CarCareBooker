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
function sandbox({
  target,
  running,
  deployExit = 0,
  prevs = [],
  images = [],
  disabled = false,
  failed = null,
  // The tag the live container was created from. On the real host this was
  // `carcarebooker:0f99f7b` — a hand-built tag, not git-<sha>.
  liveRef = null,
  // Whether the live image carries org.opencontainers.image.revision.
  labelled = true,
  // Containers (any name) holding an image, as `docker ps -aq` + inspect would report.
  inUse = [],
  // What the container runs AFTER the deploy script returns — a silent no-op leaves it alone.
  runningAfterDeploy = null,
  // Docker renamed `docker builder prune --keep-storage` to `--reserved-space`.
  modernBuilder = true,
}) {
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

  // What `docker inspect` reports for the live container, kept in files so the fake
  // deploy can change it the way a real deploy would.
  const refFile = path.join(dir, 'live-ref');
  const revFile = path.join(dir, 'live-rev');
  fs.writeFileSync(refFile, running ? (liveRef ?? `carcarebooker:git-${running}`) : '');
  fs.writeFileSync(revFile, running && labelled ? running : '');

  // The deploy and gc scripts that `git show` hands back: they record their args, and
  // the deploy moves the live container on unless the test says it silently did nothing.
  const after = runningAfterDeploy === null ? target : runningAfterDeploy;
  const deployStub = `#!/usr/bin/env bash
echo "DEPLOY $*" >> ${JSON.stringify(calls)}
if [[ "${deployExit}" == "0" && -n "${after}" ]]; then
  printf '%s' "${after}" > ${JSON.stringify(revFile)}
  printf '%s' "carcarebooker:git-${after}" > ${JSON.stringify(refFile)}
fi
exit ${deployExit}
`;
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
  const imageRows = images.map((i) => `${i.tag} ${i.id || `id-${i.tag.replace(/[^a-z0-9]/gi, '')}`} ${i.size || '500MB'}`).join('\\n');
  const psIds = inUse.map((c) => c.id).join('\\n');
  // id -> "<image id>|<image reference>", for every container the fakes know about.
  const facts = [
    ...prevs.map((p) => `${p.name}) IDVAL="id-${p.name}"; REFVAL="${p.image}" ;;`),
    ...inUse.map((c) => `${c.id}) IDVAL="${c.image}"; REFVAL="${c.ref || c.image}" ;;`),
  ].join('\n    ');

  sh('docker', `
echo "DOCKER $*" >> ${JSON.stringify(calls)}

emit() { # $1=id $2=ref $3=format
  if [[ "$3" == *'
'* ]]; then printf '%s\\n%s\\n' "$1" "$2"
  elif [[ "$3" == *Config.Image* ]]; then printf '%s\\n' "$2"
  else printf '%s\\n' "$1"; fi
}

case "$1" in
  info) exit 0 ;;
  image)
    case "$2" in
      inspect)
        shift 2; fmt=""; id=""
        while [[ $# -gt 0 ]]; do case "$1" in -f|--format) fmt="$2"; shift 2 ;; *) id="$1"; shift ;; esac; done
        # Only the live image carries a revision label, and only when the test says so.
        if [[ "$id" == "sha256:liveimage" ]]; then cat ${JSON.stringify(revFile)}; echo; else echo; fi ;;
      prune) exit 0 ;;
      *) exit 0 ;;
    esac ;;
  inspect)
    shift; fmt=""; ids=()
    while [[ $# -gt 0 ]]; do case "$1" in -f|--format) fmt="$2"; shift 2 ;; *) ids+=("$1"); shift ;; esac; done
    rc=1
    for name in "\${ids[@]}"; do
      IDVAL=""; REFVAL=""
      case "$name" in
        carcarebooker)
          ref="$(cat ${JSON.stringify(refFile)})"
          [[ -n "$ref" ]] || continue          # no such container
          IDVAL="sha256:liveimage"; REFVAL="$ref" ;;
        ${facts}
        *) continue ;;
      esac
      emit "$IDVAL" "$REFVAL" "$fmt"; rc=0
    done
    exit $rc ;;
  ps)
    if [[ "$*" == *-aq* ]]; then printf '%b\\n' "${psIds}" | sed '/^$/d'
    else printf '%b\\n' "${prevLines}" | sed '/^$/d'; fi ;;
  images)
    shift; pats=(); repo=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --filter) [[ "$2" == reference=* ]] && pats+=("\${2#reference=}"); shift 2 ;;
        --format) shift 2 ;;
        -*) shift ;;
        *) repo="$1"; shift ;;
      esac
    done
    # A positional repository argument is an OR, not an AND, exactly as Docker treats it.
    [[ -n "$repo" ]] && pats+=("$repo:*")
    while IFS= read -r row; do
      [[ -z "$row" ]] && continue
      t="\${row%% *}"
      for p in "\${pats[@]:-}"; do [[ -n "$p" && "$t" == $p ]] && { printf '%s\\n' "$row"; break; }; done
    done < <(printf '%b\\n' "${imageRows}") ;;
  builder)
    # builder prune --help is how the script decides which flag name this docker takes.
    if [[ "$*" == *--help* ]]; then
      echo "Usage:  docker builder prune [OPTIONS]"
      echo "      ${modernBuilder ? "--reserved-space bytes" : "--keep-storage bytes"}   disk space to keep for cache"
    fi
    exit 0 ;;
  rm|rmi) exit 0 ;;
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
    assert.match(calls, /DOCKER builder prune -f --reserved-space 2GB/);
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

/**
 * Regressions from the first real run on the Lightsail host (2026-09-18).
 *
 * That host still runs an image built by hand before deploy-manual.sh existed, tagged
 * `carcarebooker:0f99f7b`. Three things went wrong, and each is pinned here.
 */
describe('what the first run on the real host exposed', () => {
  const HAND_TAG = 'carcarebooker:0f99f7b';

  test('an unlabelled hand-built image is not treated as "some other commit"', () => {
    // Bug: the SHA was read from the tag, so a hand-built tag parsed as "unknown",
    // which differs from origin/main — so every single tick would start a full rebuild.
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD, liveRef: HAND_TAG, labelled: false });
    const r = run(AUTO, ['--execute'], s);
    assert.equal(r.code, 0);
    assert.match(r.out, /refusing to deploy automatically/);
    assert.match(r.out, /run one deploy by hand first/);
    assert.match(r.out, new RegExp(`deploy-manual\.sh deploy ${SHA_NEW} --execute`), 'tells you the exact command');
    assert.doesNotMatch(s.readCalls(), /DEPLOY deploy/, 'no rebuild loop');
  });

  test('the revision label is used when the tag is not a SHA', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_NEW, liveRef: HAND_TAG, labelled: true });
    const r = run(AUTO, ['--execute'], s);
    assert.equal(r.code, 0);
    assert.match(r.out, /already deployed; nothing to do/);
    assert.doesNotMatch(s.readCalls(), /DEPLOY deploy/);
  });

  test('a deploy that exits 0 without moving the container is a failure, not a success', () => {
    // Bug: exit 0 was taken as proof, so a silent no-op reported "deployed" and ran cleanup.
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD, runningAfterDeploy: SHA_OLD });
    const r = run(AUTO, ['--execute'], s);
    assert.equal(r.code, 1);
    assert.match(r.out, /reported success but the running container is bbbbbbb/);
    assert.doesNotMatch(s.readCalls(), /GC --execute/, 'nothing is cleaned up on a bogus success');
    assert.equal(fs.readFileSync(path.join(s.state, 'auto-deploy.failed'), 'utf8'), SHA_NEW);
  });

  test('cleanup leaves hand-built image tags alone', () => {
    // Bug: `docker images REPO --filter reference=REPO:git-*` ORs the two, so it listed
    // the whole repository. It deleted carcarebooker:20260910 and tried to delete the
    // live carcarebooker:0f99f7b, which Docker refused because a container held it.
    const s = sandbox({
      target: SHA_NEW,
      running: SHA_NEW,
      liveRef: HAND_TAG,
      images: [
        { tag: HAND_TAG, id: 'sha256:hand' },
        { tag: 'carcarebooker:20260910', id: 'sha256:dated' },
        { tag: 'carcarebooker:latest', id: 'sha256:latest' },
        { tag: `carcarebooker:git-${SHA_OLD}`, id: 'sha256:old' },
      ],
    });
    const r = run(GC, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    const calls = s.readCalls();
    for (const tag of [HAND_TAG, 'carcarebooker:20260910', 'carcarebooker:latest']) {
      assert.doesNotMatch(calls, new RegExp(`DOCKER rmi ${tag.replace('.', '\.')}`), `${tag} was built by hand and is not ours to remove`);
    }
    assert.match(calls, new RegExp(`DOCKER rmi carcarebooker:git-${SHA_OLD}`), 'a stale git- build is still removed');
  });

  test('an image any container still holds is never a candidate', () => {
    const orphanSha = 'f'.repeat(40);
    const s = sandbox({
      target: SHA_NEW,
      running: SHA_NEW,
      images: [
        { tag: `carcarebooker:git-${SHA_NEW}`, id: 'sha256:liveimage' },
        { tag: `carcarebooker:git-${orphanSha}`, id: 'sha256:held' },
      ],
      // Not a carcarebooker-prev-* container, so the keep-list alone would miss it.
      inUse: [{ id: '7c2f615aea3a', image: 'sha256:held', ref: `carcarebooker:git-${orphanSha}` }],
    });
    const r = run(GC, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /used by a container/);
    assert.doesNotMatch(s.readCalls(), new RegExp(`DOCKER rmi carcarebooker:git-${orphanSha}`));
  });

  test('the newest rollback- reference survives, older ones do not', () => {
    const s = sandbox({
      target: SHA_NEW,
      running: SHA_NEW,
      images: [
        { tag: `carcarebooker:git-${SHA_NEW}`, id: 'sha256:liveimage' },
        { tag: 'carcarebooker:rollback-20260917T100000Z', id: 'sha256:rb1' },
        { tag: 'carcarebooker:rollback-20260801T100000Z', id: 'sha256:rb2' },
      ],
    });
    const r = run(GC, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    const calls = s.readCalls();
    assert.doesNotMatch(calls, /DOCKER rmi carcarebooker:rollback-20260917T100000Z/, 'deploy-manual.sh rollback needs it');
    assert.match(calls, /DOCKER rmi carcarebooker:rollback-20260801T100000Z/);
  });
});

describe('the build-cache flag matches the installed Docker', () => {
  const base = { target: SHA_NEW, running: SHA_NEW, images: [{ tag: `carcarebooker:git-${SHA_NEW}`, id: 'sha256:liveimage' }] };

  test('a Docker that takes --reserved-space is given --reserved-space', () => {
    const s = sandbox({ ...base, modernBuilder: true });
    const r = run(GC, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    assert.match(s.readCalls(), /DOCKER builder prune -f --reserved-space 2GB/);
    assert.doesNotMatch(s.readCalls(), /--keep-storage/, 'the deprecated name warns and will stop working');
  });

  test('an older Docker still gets --keep-storage', () => {
    const s = sandbox({ ...base, modernBuilder: false });
    const r = run(GC, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    assert.match(s.readCalls(), /DOCKER builder prune -f --keep-storage 2GB/);
    assert.doesNotMatch(s.readCalls(), /--reserved-space/);
  });
});

describe('CI-built image: auto-deploy waits for it, deploy-manual pulls and verifies it', () => {
  test('exit 75 (image not in the registry yet) is not a failed deploy and is not recorded', () => {
    const s = sandbox({ target: SHA_NEW, running: SHA_OLD, deployExit: 75 });
    const r = run(AUTO, ['--execute'], s);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /not in the registry yet/);
    assert.ok(!fs.existsSync(path.join(s.state, 'auto-deploy.failed')), 'a not-yet-built image must not mark the commit failed');
    assert.doesNotMatch(s.readCalls(), /GC --execute/, 'no cleanup when nothing was deployed');
    // The next tick looks again: still a deploy attempt, because the commit was never recorded.
    const again = sandbox({ target: SHA_NEW, running: SHA_OLD });
    assert.match(run(AUTO, ['--execute'], again).out, /deployed aaaaaaa/);
  });

  // pull_prebuilt() from deploy-manual.sh, run for real against a fake `docker`.
  const MANUAL = path.join(repoRoot, 'scripts/deploy-manual.sh');
  const SHA = 'a'.repeat(40);
  function pullHarness({ pull = 'ok', revision = SHA, creds = null, credsMode = 0o600, execute = '1' } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p91-pull-'));
    const state = path.join(dir, 'state');
    fs.mkdirSync(state, { recursive: true });
    if (creds) fs.writeFileSync(path.join(state, 'ghcr.env'), creds, { mode: credsMode });
    const log = path.join(dir, 'docker.log');
    fs.writeFileSync(log, '');
    const text = fs.readFileSync(MANUAL, 'utf8').replace(/\r\n/g, '\n');
    const from = text.indexOf('REGISTRY_ENV="$STATE_DIR/ghcr.env"');
    const to = text.indexOf('# 3-4. The image pinned');
    assert.ok(from > 0 && to > from, 'pull block not found in deploy-manual.sh');
    const script = `
set -Eeuo pipefail
STATE_DIR='${state}'; EXECUTE='${execute}'; SHA='${SHA}'; IMAGE="carcarebooker:git-$SHA"
die() { echo "ABORT: $*" >&2; exit 1; }
note() { echo "[deploy] $*"; }
image_revision() { echo '${revision}'; }
stat() { if [[ "$2" == "%a" ]]; then printf '%s' "$FAKE_PERM"; else printf '0'; fi; }
install() { local d; for d; do :; done; mkdir -p "$d"; }
docker() {
  echo "docker $*" >> '${log}'
  if [[ "$1" == "login" ]]; then cat > /dev/null; fi
  if [[ "$1" == "pull" ]]; then
    case '${pull}' in
      ok) return 0 ;;
      missing) echo "Error response from daemon: manifest unknown" >&2; return 1 ;;
      denied) echo "Error response from daemon: denied: permission_denied" >&2; return 1 ;;
    esac
  fi
  return 0
}
${text.slice(from, to)}
pull_prebuilt
`;
    const sh = path.join(dir, 'h.sh');
    fs.writeFileSync(sh, script);
    let code = 0, out = '';
    try {
      out = execFileSync('bash', [sh], { env: { ...process.env, FAKE_PERM: credsMode.toString(8) }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status ?? 1;
      out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }
    return { code, out, calls: fs.readFileSync(log, 'utf8') };
  }

  test('a good image is pulled by SHA, re-tagged carcarebooker:git-<sha>, and its registry tag dropped', () => {
    const r = pullHarness({ creds: 'GHCR_USER=bot\nGHCR_TOKEN=tok123\n' });
    assert.equal(r.code, 0, r.out);
    assert.match(r.calls, new RegExp(`docker pull ghcr\\.io/hpalrecha/carcarebooker:${SHA}`));
    assert.match(r.calls, new RegExp(`docker tag ghcr\\.io/hpalrecha/carcarebooker:${SHA} carcarebooker:git-${SHA}`));
    assert.match(r.calls, new RegExp(`docker rmi ghcr\\.io/hpalrecha/carcarebooker:${SHA}`));
    assert.match(r.calls, /docker login ghcr\.io -u bot --password-stdin/);
    assert.doesNotMatch(r.out + r.calls, /tok123/, 'the token is never printed or put on a command line');
    assert.doesNotMatch(r.calls, /docker build/, 'nothing is built on the host');
  });

test('a public image needs no credentials: with no ghcr.env it pulls anonymously and never logs in', () => {
    const r = pullHarness({});
    assert.equal(r.code, 0, r.out);
    assert.match(r.calls, new RegExp(`docker pull ghcr\.io/hpalrecha/carcarebooker:${SHA}`));
    assert.doesNotMatch(r.calls, /docker login/, 'no credentials means no login attempt');
    assert.match(r.calls, new RegExp(`docker tag ghcr\.io/hpalrecha/carcarebooker:${SHA} carcarebooker:git-${SHA}`));
  });

  test('an image that is not published yet exits 75 and changes nothing', () => {
    const r = pullHarness({ pull: 'missing', creds: 'GHCR_USER=bot\nGHCR_TOKEN=t\n' });
    assert.equal(r.code, 75, r.out);
    assert.doesNotMatch(r.calls, /docker tag/);
  });

  test('a denied pull is a real failure, not "try again"', () => {
    const r = pullHarness({ pull: 'denied' });
    assert.equal(r.code, 1);
    assert.match(r.out, /denied or unauthorized/);
  });

  test('an image whose revision label is not the SHA is refused', () => {
    const r = pullHarness({ revision: 'b'.repeat(40), creds: 'GHCR_USER=bot\nGHCR_TOKEN=t\n' });
    assert.equal(r.code, 1);
    assert.match(r.out, /refusing it/);
    assert.doesNotMatch(r.calls, /docker tag/);
  });

  test('a credentials file anyone else can read is refused', () => {
    const r = pullHarness({ creds: 'GHCR_USER=bot\nGHCR_TOKEN=t\n', credsMode: 0o644 });
    assert.equal(r.code, 1);
    assert.match(r.out, /must be owned by root with mode 600/);
  });

  test('dry-run pulls nothing', () => {
    const r = pullHarness({ execute: '0', creds: 'GHCR_USER=bot\nGHCR_TOKEN=t\n' });
    assert.equal(r.code, 0, r.out);
    assert.equal(r.calls, '');
    assert.match(r.out, /would pull the prebuilt image/);
  });

  test('building on the host only happens with an explicit --build-local', () => {
    const text = fs.readFileSync(MANUAL, 'utf8').replace(/\r\n/g, '\n');
    assert.match(text, /elif \[\[ "\$BUILD_LOCAL" != "1" \]\]; then\n  pull_prebuilt/);
    assert.match(text, /--build-local\) BUILD_LOCAL=1/);
    assert.match(text, /^BUILD_LOCAL=0$/m);
  });
});

describe('the GitHub Actions build', () => {
  const wf = fs.readFileSync(path.join(repoRoot, '.github/workflows/build-image.yml'), 'utf8').replace(/\r\n/g, '\n');

  test('publishes an immutable SHA tag with a matching revision label, using only GITHUB_TOKEN', () => {
    assert.match(wf, /\$\{\{ steps\.image\.outputs\.name \}\}:\$\{\{ github\.sha \}\}/);
    assert.match(wf, /org\.opencontainers\.image\.revision=\$\{\{ github\.sha \}\}/);
    assert.match(wf, /packages: write/);
    assert.match(wf, /secrets\.GITHUB_TOKEN/);
    assert.doesNotMatch(wf.replace(/secrets\.GITHUB_TOKEN/g, ''), /secrets\./, 'no other secret is needed or used');
  });

  test('builds the production Dockerfile for the host architecture, with layer caching', () => {
    assert.match(wf, /file: \.\/Dockerfile/);
    assert.match(wf, /platforms: linux\/amd64/);
    assert.match(wf, /cache-from: type=gha/);
    assert.match(wf, /cache-to: type=gha,mode=max/);
    assert.match(wf, /push: true/);
  });

  test('does not deploy anything', () => {
    const code = wf.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
    assert.doesNotMatch(code, /\bssh\b|scp|rsync|appleboy|lightsail/i);
  });
});
