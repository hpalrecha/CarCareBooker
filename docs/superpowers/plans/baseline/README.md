# Baseline for Plan 1 (branch refactor/monorepo-layout, 26 Nov 2026)

Taken after a fresh `npm run build:app` on the unmoved tree.

| Check | Command | Result |
|---|---|---|
| Unit tests | `node --test "tests/**/*.test.mjs"` | 678 tests, 678 pass, 0 fail (includes the 6 new relocate tests; the 5 failures seen earlier were caused by a stale dist/) |
| Integration tests | `npm run test:integration` | 471 tests, 213 pass, 0 fail, 258 cancelled (pre-existing: several itest files error at import, e.g. `server/middleware/auth.ts:3`; Plan 4 fixes) |
| Type check | `npx tsc --noEmit \| grep -c "error TS"` | 34 on main; 35 after Task 2 (same error set, one tsc message split in two by the alias change). Rule: the per-file error counts must not change |
| Dist fingerprint | `node scripts/tools/dist-fingerprint.mjs` | 110 files, 33 html (`dist-fingerprint.json`) |

Every later task must match these numbers (or improve the type-check count) and produce an identical fingerprint.
