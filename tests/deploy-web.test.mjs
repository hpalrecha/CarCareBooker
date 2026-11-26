/**
 * Plan 3 Task 6: scripts/deploy-web.sh, the nginx locations for the cutover, and the API deploy's
 * public checks after the cutover.
 *
 * deploy-web.sh is run by bash in a sandbox whose PATH provides fake `git`, `docker`, `curl`, `flock`
 * and `date` (the same approach as tests/auto-deploy.test.mjs), in dry-run, so every guard is
 * executed for real and the fake docker records that nothing was changed.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8').replace(/\r\n/g, '\n');
const SCRIPT = path.join(repoRoot, 'scripts/deploy-web.sh');
const SHA = 'c'.repeat(40);

function sandbox({ ist = '1100', utc = '0530', containers = [], inMain = true, candidatePortBusy = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p91-web-'));
  const bin = path.join(dir, 'bin');
  const repo = path.join(dir, 'repo');
  const state = path.join(dir, 'state');
  const calls = path.join(dir, 'calls.log');
  for (const d of [bin, path.join(repo, '.git'), state]) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(calls, '');
  const sh = (name, body) => fs.writeFileSync(path.join(bin, name), `#!/usr/bin/env bash\n${body}\n`, { mode: 0o755 });
  sh('docker', `echo "docker $*" >> ${JSON.stringify(calls)}
case "$1" in
  info) exit 0 ;;
  inspect)
    name="\${@: -1}"
    case " ${containers.join(' ')} " in *" $name "*) ;; *) exit 1 ;; esac
    if [[ "$2" == "-f" ]]; then echo "carcarebooker-web:git-${'b'.repeat(40)}"; fi
    exit 0 ;;
  image) exit 1 ;;
  *) exit 0 ;;
esac`);
  sh('git', `[[ "$1" == "-C" ]] && shift 2
echo "git $*" >> ${JSON.stringify(calls)}
case "$1" in
  remote) echo "https://github.com/hpalrecha/CarCareBooker.git" ;;
  fetch|cat-file) exit 0 ;;
  merge-base) exit ${inMain ? 0 : 1} ;;
  log) if [[ "$*" == *"--format=%H"* ]]; then echo "${SHA}"; else echo "2026-11-26 web change"; fi ;;
esac`);
  sh('curl', `echo "curl $*" >> ${JSON.stringify(calls)}
if [[ "$*" == *":18085/"* && "${candidatePortBusy}" == "true" ]]; then exit 0; fi
exit 7`);
  sh('flock', 'exit 0');
  sh('date', `if [[ "$*" == "+%z" ]]; then echo "+0530"; exit 0; fi
if [[ "$1" == "-u" && "$2" == "+%H%M" ]]; then echo "${utc}"; exit 0; fi
if [[ "$1" == "+%H%M" ]]; then echo "${ist}"; exit 0; fi
exec /usr/bin/date "$@"`);
  return { dir, repo, state, calls, readCalls: () => fs.readFileSync(calls, 'utf8') };
}

function run(s, args = []) {
  const env = { ...process.env, PATH: `${path.join(s.dir, 'bin')}${path.delimiter}${process.env.PATH}`, P91_DEPLOY_STATE_DIR: s.state };
  try {
    const out = execFileSync('bash', [SCRIPT, '--repo', s.repo, ...args], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

const MUTATING = /docker (run|stop|rename|rm|pull|login|tag|start)\b/;

describe('scripts/deploy-web.sh', () => {
  test('is valid bash', () => {
    execFileSync('bash', ['-n', SCRIPT]);
  });

  test('dry-run (first deploy): picks the newest web commit, plans candidate then production, changes nothing', () => {
    const s = sandbox();
    const r = run(s);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /MODE: DRY-RUN/);
    assert.match(s.readCalls(), /git log -1 --format=%H origin\/main -- apps\/web packages\/content packages\/domain package-lock\.json \.github\/workflows\/build-web-image\.yml/);
    assert.match(r.out, new RegExp(`would pull ghcr\\.io/hpalrecha/carcarebooker-web:${SHA}`));
    assert.match(r.out, new RegExp(`would run: docker run -d --name carcarebooker-web-candidate --restart no -p 127\\.0\\.0\\.1:18085:3000 .*carcarebooker-web:git-${SHA}`));
    assert.match(r.out, new RegExp(`would run: docker run -d --name carcarebooker-web --restart unless-stopped -p 127\\.0\\.0\\.1:8085:3000 .*carcarebooker-web:git-${SHA}`));
    assert.match(r.out, /DRY-RUN COMPLETE/);
    assert.doesNotMatch(s.readCalls(), MUTATING, 'dry-run must not change Docker');
  });

  test('dry-run with a running web container: it is stopped and kept as carcarebooker-web-previous', () => {
    const s = sandbox({ containers: ['carcarebooker-web', 'carcarebooker-web-previous'] });
    const r = run(s, ['--sha', SHA]);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /would run: docker rm -f carcarebooker-web-previous/);
    assert.match(r.out, /would run: docker stop -t 20 carcarebooker-web\n/);
    assert.match(r.out, /would run: docker rename carcarebooker-web carcarebooker-web-previous/);
    assert.doesNotMatch(s.readCalls(), /git log -1 --format=%H/, 'an explicit --sha is used as given');
    assert.doesNotMatch(s.readCalls(), MUTATING);
  });

  test('refuses 19:45-20:15 IST with exit 75 before anything is planned', () => {
    for (const [ist, utc] of [['1945', '1415'], ['2000', '1430'], ['2015', '1445']]) {
      const s = sandbox({ ist, utc });
      const r = run(s);
      assert.equal(r.code, 75, `${ist}: ${r.out}`);
      assert.match(r.out, /19:45-20:15 IST/);
      assert.doesNotMatch(r.out, /would run: docker run/);
    }
    const ok = sandbox({ ist: '2016', utc: '1446' });
    assert.equal(run(ok).code, 0);
  });

  test('a clock that disagrees with UTC+05:30 is refused', () => {
    const r = run(sandbox({ ist: '1100', utc: '0100' }));
    assert.equal(r.code, 1);
    assert.match(r.out, /disagrees with UTC\+05:30/);
  });

  test('refuses a short SHA, a commit outside origin/main, a busy candidate port and a leftover candidate', () => {
    assert.match(run(sandbox(), ['--sha', 'abc123']).out, /full 40-character commit SHA/);
    assert.match(run(sandbox({ inMain: false }), ['--sha', SHA]).out, /is not in origin\/main/);
    assert.match(run(sandbox({ candidatePortBusy: true })).out, /port 18085 is already in use/);
    assert.match(run(sandbox({ containers: ['carcarebooker-web-candidate'] })).out, /carcarebooker-web-candidate already exists/);
  });

  test('the container gets no env file, no volumes, loopback ports only, and is verified on title, PPF page and sitemap', () => {
    const src = read('scripts/deploy-web.sh');
    for (const m of src.matchAll(/run docker run [^\n]*/g)) assert.doesNotMatch(m[0], /--env-file|\s-v\s|--volume|--mount/, m[0]);
    assert.equal([...src.matchAll(/run docker run /g)].length, 2, 'candidate and production');
    for (const m of src.matchAll(/-p "([^"]+)"/g)) assert.match(m[1], /^127\.0\.0\.1:/, m[1]);
    assert.match(src, /<title>\[\^<\]\*P91/);
    assert.match(src, /\/services\/paint-protection-film/);
    assert.match(src, /sitemap\.xml/);
    assert.match(src, /REGISTRY_ENV="\$STATE_DIR\/ghcr\.env"/, 'same credentials file as deploy-manual.sh');
    assert.match(src, /must be owned by root with mode 600/);
    assert.match(src, /docker rm -f \$APP && docker rename \$PREVIOUS \$APP && docker start \$APP/, 'prints the rollback command');
  });
});

describe('deploy/nginx/p91carcare.locations.conf', () => {
  const conf = read('deploy/nginx/p91carcare.locations.conf');
  const blocks = [...conf.matchAll(/^location\s+(.+?)\s*\{([\s\S]*?)^\}/gm)].map((m) => ({ head: m[1], body: m[2] }));
  const target = (head) => blocks.find((b) => b.head === head)?.body.match(/proxy_pass (\S+);/)?.[1];

  test('the routing table from the plan', () => {
    for (const head of ['^~ /api/', '= /admin', '^~ /admin/', '^~ /uploads/', '^~ /attached_assets/', '^~ /service/', '^~ /booking-confirmation/', '^~ /assets/', '^~ /fonts/', '^~ /og/']) {
      assert.equal(target(head), 'http://127.0.0.1:8084', head);
    }
    assert.equal(target('/'), 'http://127.0.0.1:8085');
  });

  test('every top-level file of the old public folder stays on the API container', () => {
    const fileBlock = blocks.find((b) => b.head.startsWith('~ "'));
    assert.ok(fileBlock, 'one regex block for single files');
    assert.match(fileBlock.body, /proxy_pass http:\/\/127\.0\.0\.1:8084;/);
    const re = new RegExp(fileBlock.head.slice(3, -1));
    for (const e of fs.readdirSync(path.join(repoRoot, 'apps/admin/public'), { withFileTypes: true })) {
      if (e.isDirectory()) assert.ok(blocks.some((b) => b.head === `^~ /${e.name}/`), `/${e.name}/`);
      else assert.ok(re.test(`/${e.name}`), `/${e.name}`);
    }
    for (const p of ['/robots.txt', '/sitemap.xml', '/llms.txt', '/', '/services/paint-protection-film']) assert.ok(!re.test(p), `${p} belongs to the new site`);
  });

  test('every block forwards the same proxy headers', () => {
    for (const b of blocks) {
      for (const h of ['proxy_http_version 1.1;', 'proxy_set_header Host $host;', 'proxy_set_header X-Real-IP $remote_addr;', 'proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;', 'proxy_set_header X-Forwarded-Proto $scheme;']) {
        assert.ok(b.body.includes(h), `${b.head}: ${h}`);
      }
    }
  });
});

describe('API deploys keep verifying the public site after the cutover', () => {
  test('deploy-manual.sh checks the public site only on paths nginx keeps on the API container', () => {
    const src = read('scripts/deploy-manual.sh');
    assert.match(src, /readonly PUBLIC_PROBE_PAGE="\/service\/ppf-hatchback"/);
    assert.match(src, /live="\$\(entry_asset "\$PUBLIC_URL" "\$PUBLIC_PROBE_PAGE"\)"/);
    assert.match(src, /check_public_app "\$PUBLIC_URL"/);
    assert.doesNotMatch(src, /check_app "\$PUBLIC_URL"/, '/, /ppf and /services move to the new site');
    const conf = read('deploy/nginx/p91carcare.locations.conf');
    assert.match(conf, /location \^~ \/service\/ \{\s*proxy_pass http:\/\/127\.0\.0\.1:8084;/);
  });
});

describe('the cutover runbook', () => {
  const rb = read('docs/superpowers/plans/plan-3-cutover-runbook.md');
  test('covers every step with a rollback, and never edits nginx with sed', () => {
    for (const s of ['nginx -t', 'systemctl reload nginx', 'deploy-web.sh', 'snippets/p91carcare.locations.conf', 'Rollback', '20:00 IST']) assert.ok(rb.includes(s), s);
    assert.doesNotMatch(rb, /\bsed\s+-i\b/);
  });
});
