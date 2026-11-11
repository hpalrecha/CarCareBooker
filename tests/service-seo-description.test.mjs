/**
 * serviceSeoDescription: the meta description of every /service/:slug page.
 *
 * THE DEFECT THIS GUARDS. When a record's description was longer than the 160-character snippet, the function cut
 * it at a word boundary and removed ONE trailing connective. A cut ending "... resistance and a" lost the "a" and
 * kept the "and", so the P91 PPF Premium Sedan and SUV pages published
 * "... tougher stone-chip and scratch resistance and. Studio in Adugodi, Bangalore."
 *
 * The fixture is the live catalogue (all 15 active records, public GET /api/services, 2026-11-11). `expected` is the
 * output after the fix. Thirteen records are unchanged from before the fix (no `previousOutput`); only the two
 * Premium records differ, which is the whole behavioural change.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const fixture = JSON.parse(read('tests/fixtures/live-service-descriptions.json'));

const PLACE = ' Studio in Adugodi, Bangalore.';
const DANGLING = /\s(and|or|the|a|an|of|to|with|your|such as|that)\.?$/i;

let m;
before(async () => {
  const out = path.join(repoRoot, 'node_modules', '.cache', 'service-seo-description-test.mjs');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await esbuild.build({
    entryPoints: [path.join(repoRoot, 'client', 'src', 'lib', 'service-seo.ts')],
    bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
    alias: { '@': path.join(repoRoot, 'client', 'src') },
  });
  m = await import(pathToFileURL(out).href + '?t=' + Date.now());
});

const describeRecord = (r) => m.serviceSeoDescription({
  title: r.title, slug: r.slug, description: r.description, metaDescription: r.metaDescription,
});

describe('dropDanglingWords', () => {
  test('removes every trailing connective, not just one', () => {
    assert.equal(m.dropDanglingWords('tougher stone-chip and scratch resistance and a'), 'tougher stone-chip and scratch resistance');
    assert.equal(m.dropDanglingWords('for sedans with the'), 'for sedans');
    assert.equal(m.dropDanglingWords('cleans surfaces such as'), 'cleans surfaces');
  });
  test('leaves text that already ends on a content word untouched', () => {
    assert.equal(m.dropDanglingWords('scratch resistance'), 'scratch resistance');
    assert.equal(m.dropDanglingWords('Paint Protection Film'), 'Paint Protection Film');
  });
  test('does not strip a connective that is part of a longer word', () => {
    assert.equal(m.dropDanglingWords('hand'), 'hand');
    assert.equal(m.dropDanglingWords('a standard'), 'a standard');
  });
});

describe('every live record (all 15)', () => {
  test('the fixture holds the full live catalogue', () => {
    assert.equal(fixture.records.length, 15);
    for (const slug of ['ppf-premium-hatchback', 'ppf-premium-sedan', 'ppf-premium-suv', 'ppf-hatchback', 'ppf-sedan', 'ppf-suv']) {
      assert.ok(fixture.records.some((r) => r.slug === slug), slug);
    }
  });

  for (const r of fixture.records) {
    test(`${r.slug}: complete, within 160, names Adugodi, ends on a content word`, () => {
      const out = describeRecord(r);
      assert.equal(out, r.expected, 'output must equal the recorded expectation');
      assert.ok(out.length <= 160, `${out.length} characters`);
      assert.match(out, /Adugodi/);
      assert.ok(!/\.\./.test(out), 'no doubled full stop');
      const body = out.endsWith(PLACE) ? out.slice(0, -PLACE.length) : out;
      assert.ok(!DANGLING.test(body), `ends on a connective: "...${body.slice(-30)}"`);
    });
  }

  test('only the two Premium records changed against the old output', () => {
    const changed = fixture.records.filter((r) => r.previousOutput).map((r) => r.slug).sort();
    assert.deepEqual(changed, ['ppf-premium-sedan', 'ppf-premium-suv']);
    for (const r of fixture.records.filter((x) => x.previousOutput)) {
      assert.match(r.previousOutput, /resistance and\. Studio in Adugodi/, 'the defect that was fixed');
    }
  });
});

describe('Premium Sedan and SUV (the reported pages)', () => {
  const byslug = (s) => fixture.records.find((r) => r.slug === s);
  test('no longer end with incomplete text', () => {
    assert.equal(
      describeRecord(byslug('ppf-premium-sedan')),
      'Our premium-tier Paint Protection Film for sedans, with a higher-grade film for tougher stone-chip and scratch resistance. Studio in Adugodi, Bangalore.',
    );
    assert.equal(
      describeRecord(byslug('ppf-premium-suv')),
      'Our premium-tier Paint Protection Film for SUVs, with a higher-grade film for tougher stone-chip and scratch resistance. Studio in Adugodi, Bangalore.',
    );
  });
});

describe('the server HTML and the browser use the same function', () => {
  test('server/vite.ts and service-landing.tsx both call serviceSeoDescription from lib/service-seo', () => {
    assert.match(read('server/vite.ts'), /serviceSeoDescription[\s\S]{0,200}service-seo|service-seo[\s\S]{0,400}serviceSeoDescription/);
    assert.match(read('client/src/pages/service-landing.tsx'), /import \{[^}]*serviceSeoDescription[^}]*\} from "@\/lib\/service-seo"/);
    assert.match(read('server/vite.ts'), /serviceSeoDescription\(service\)/);
    assert.match(read('client/src/pages/service-landing.tsx'), /description: serviceSeoDescription\(service\)/);
  });
});
