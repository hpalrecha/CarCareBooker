/**
 * The integration tests fake storage, so they cannot prove the real UPDATE statements are conditional.
 * These read server/storage.ts and the migration and assert the guards are in the SQL itself.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r\n/g, '\n');
const storage = read('server/storage.ts');
const routes = read('server/routes.ts');
const method = (name) => {
  const i = storage.indexOf('async ' + name + '(');
  assert.ok(i > -1, name + ' must exist in DatabaseStorage');
  return storage.slice(i, storage.indexOf('\n  }\n', i));
};

describe('paid-lead writes are atomic and conditional in the database itself', () => {
  test('markPpfLeadPaid: a single UPDATE that only touches rows that are not already paid', () => {
    const m = method('markPpfLeadPaid');
    assert.match(m, /\.update\(ppfLeads\)/);
    assert.match(m, /ne\(ppfLeads\.paymentStatus, "paid"\)/, 'condition is part of the UPDATE');
    assert.match(m, /isNull\(ppfLeads\.paymentStatus\)/);
    assert.match(m, /\.returning\(\)/);
  });

  test('markPpfLeadFailed: only ever from pending/failed, so a paid lead cannot be overwritten', () => {
    const m = method('markPpfLeadFailed');
    assert.match(m, /inArray\(ppfLeads\.paymentStatus, \["pending", "failed"\]\)/);
    assert.ok(!/"paid"/.test(m.replace(/paymentStatus: "failed"/g, '')), 'the failed writer never names "paid"');
  });

  test('deletePpfLead: the paid guard is part of the DELETE statement', () => {
    const m = method('deletePpfLead');
    assert.match(m, /\.delete\(ppfLeads\)/);
    assert.match(m, /ne\(ppfLeads\.paymentStatus, "paid"\)/);
    assert.match(m, /isNull\(ppfLeads\.paymentStatus\)/);
    assert.match(m, /return deleted\.length > 0/);
  });

  test('no read-then-write status update remains', () => {
    assert.ok(!/updatePpfLeadPayment/.test(storage) && !/updatePpfLeadPayment/.test(routes));
  });
});

describe('routes: lead state model', () => {
  test('the webhook marks a lead paid only on payment.captured', () => {
    const i = routes.indexOf('waiting for capture');
    assert.ok(i > -1);
    const block = routes.slice(i - 700, i);
    assert.match(block, /event\.event === "payment\.captured"/);
  });

  test('the order endpoint normalises the phone and blocks a second payment', () => {
    assert.match(routes, /normalizeIndianMobile\(data\.phone\)/);
    assert.match(routes, /phone: phone\.national/);
    assert.match(routes, /status\(409\)/);
    assert.match(routes, /23505/);
  });
});

describe('migration', () => {
  const sql = read('migrations/manual/2026-09-26-ppf-leads-offer-payments.sql');
  const rollback = read('migrations/manual/2026-09-26-ppf-leads-offer-payments.rollback.sql');

  test('adds a unique index so one customer cannot have two leads for one offer, outside ordinary leads', () => {
    assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS ppf_leads_offer_phone_uniq\s+ON ppf_leads \(offer_name, phone\)\s+WHERE offer_name IS NOT NULL/);
  });

  test('is additive and idempotent: nothing is dropped, everything is IF NOT EXISTS', () => {
    const code = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
    assert.ok(!/\bDROP\b/i.test(code));
    for (const stmt of code.split(';').map((x) => x.trim()).filter(Boolean)) assert.match(stmt, /IF NOT EXISTS/, stmt);
  });

  test('the rollback removes the new unique index too', () => {
    assert.match(rollback, /DROP INDEX IF EXISTS ppf_leads_offer_phone_uniq/);
  });
});
