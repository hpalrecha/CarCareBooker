import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../server/services/lead-sheet.ts", import.meta.url), "utf8");

test("lead sheet sync is env-driven with no hardcoded host", () => {
  assert.match(src, /process\.env\.GOOGLE_SHEET_WEBHOOK_URL/);
  assert.doesNotMatch(src, /https?:\/\/[a-z0-9.-]+\.(com|app|io|net)/i);
});

test("sync is fire-and-forget and bounded by a timeout", () => {
  assert.match(src, /REQUEST_TIMEOUT_MS = 10_000/);
  assert.match(src, /\.catch\(/);
  assert.match(src, /clearTimeout\(timer\)/);
});

test("route calls the sync after the lead is saved", () => {
  const routes = readFileSync(new URL("../server/routes.ts", import.meta.url), "utf8");
  const create = routes.indexOf("storage.createPpfLead({");
  const call = routes.indexOf("sendLeadToSheet(lead);", create);
  assert.ok(create > 0 && call > create, "sendLeadToSheet must run after createPpfLead");
});
