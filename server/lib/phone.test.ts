// Run with:  node --import tsx --test server/lib/phone.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeIndianMobile, maskPhoneDigits } from "./phone";

const ok = (input: string, e164 = "919876543210") => {
  const r = normalizeIndianMobile(input);
  assert.equal(r.ok, true, `${input} should be valid`);
  if (r.ok) assert.equal(r.e164, e164);
};
const bad = (input: any) => assert.equal(normalizeIndianMobile(input).ok, false, `${input} should be rejected`);

test("plain 10-digit", () => ok("9876543210"));
test("0-prefixed 11-digit", () => ok("09876543210"));
test("91-prefixed 12-digit", () => ok("919876543210"));
test("+91 E.164", () => ok("+919876543210"));
test("+91 with spaces and hyphens", () => ok("+91 98765-43210"));
test("0091 international prefix", () => ok("00919876543210"));

test("reject too short", () => bad("98765"));
test("reject invalid 11-digit (not 0-prefixed)", () => bad("12345678901"));
test("reject starting with 5 or below", () => bad("5876543210"));
test("reject empty / null / undefined", () => { bad(""); bad(null); bad(undefined); });
test("reject letters only", () => bad("not-a-number"));
test("reject 12-digit not 91", () => bad("129876543210"));

test("different valid prefixes 6/7/8/9", () => {
  ok("6012345678", "916012345678");
  ok("7012345678", "917012345678");
  ok("8012345678", "918012345678");
});

test("maskPhoneDigits keeps 4+3", () => {
  assert.equal(maskPhoneDigits("919876543210"), "9198***210");
  assert.equal(maskPhoneDigits(null), "-");
  assert.equal(maskPhoneDigits("123"), "***");
});
