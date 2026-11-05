# Sticker integration — executed Phase 1 QA

Date: 2026-11-05. Scope: local mock and static assets only, as defined in [STICKER_PHASE1_PLAN.md](STICKER_PHASE1_PLAN.md).

## Actual executed results

| Command/check | Result |
| --- | --- |
| `npm test` | Exit 0; 5 files, **50 tests passed** |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npm run test:e2e` | Exit 0; **32 passed (1.4m)** in the final review-fix run, Chromium desktop 1440×1000 and mobile 360×800 |
| `npm run test:rules` | Exit 0; **24 tests passed**, Firestore Emulator Standard deny-all baseline |
| Original-pixel comparison using local Pillow/NumPy | All 15 full PNG crops retain source RGB at every nontransparent pixel |

The unit count includes 21 existing regression cases, 13 new first-writer/sticker cases and 16 catalog/PNG delivery cases. The final browser count includes 20 existing diary cases and 12 sticker cases (six scenarios on each viewport). **106 automated tests passed across the three suites**, without claiming production Firebase behavior. After review fixes, root reran lint, typecheck, all 50 unit tests, build and all 32 browser tests; the 24-test emulator result applies to the unchanged deny-all rules and test suite.

Representative actual output:

```text
Test Files  5 passed (5)
     Tests  50 passed (50)

32 passed (1.4m)

Test Files  1 passed (1)
     Tests  24 passed (24)
+ Script exited successfully (code 0)

PASS: all 15 full sticker crops retain original RGB at every nontransparent pixel.
```

The initial unit run had eight failures from the test assuming square 96×96 thumbnails. The extraction correctly preserves aspect ratio (e.g. 93×96). The test now verifies maximum edge 96 and preserved aspect ratio; the full rerun passed. No production code or asset was changed to satisfy that mistaken square assumption.

## Coverage and limits

- The first successful local note assigns one first writer, starts pending without a random sticker and grants only that writer's bound mock actor the initial selection.
- Sequential A/B writes against shared persistence retain A's first-note attribution. B cannot select or impersonate A through the mock interface. This is **not a simultaneous transaction test**.
- Valid IDs persist once; invalid/path/URL IDs and replacement attempts are rejected.
- Hiding first/last notes and reloading preserves first-writer attribution, selected sticker and the hidden rich-text content.
- A failed first note write publishes neither note nor attribution. Failed sticker persistence keeps metadata pending, selection intact and the picker open with an error.
- Existing v1 arrays migrate without losing notes or rich text; unknown historical first-writer order stays unknown and does not grant selection rights.
- All fifteen full assets and thumbnails decode as RGBA PNGs with transparent pixels, opaque interiors and antialiased alpha. Catalog dimensions match full PNG headers; thumbnails have maximum edge 96; full files remain below 256 KiB and thumbnails below 40 KiB.
- Keyboard radio selection plus explicit confirmation works in the native dialog. Cancellation leaves selection pending. Image load errors disable the affected option; a delayed image that ultimately fails cannot be saved before loading or after failure.
- Calendar uses the same selected ID as day detail, including after deleting the only visible note. Picker/page overflow checks pass at both tested widths.
- A selected author with no visible notes does not hide the assigned shared day sticker; filtered note count correctly becomes zero. Legacy v1 calendar dates display `Chưa rõ` and no picker rather than suggesting an available pending selection.
- Existing formatting, historical dates, drafts, note revision conflicts, soft-delete/history, month/author filtering and mock-only join regressions passed.

The emulator tests only establish that **all backend operations remain blocked in Phase 1**, including anonymous and nonmember requests to day paths. They do not establish a permissive membership model, first-writer assignment rules, transaction contention correctness or production security.

Still deferred: actual concurrent Firestore first-note commits, exactly-one-winner proof under contention, authenticated membership/authorization success cases, catalog-ID enforcement in production rules and failed Firestore transactions. Mobile coverage is browser emulation, not a real-device walkthrough. Asset edge quality and source rights require manual/owner review before production distribution.

## Files owned by QA

- `tests/unit/day-stickers.test.ts`
- `tests/unit/sticker-assets.test.ts`
- `tests/e2e/stickers.spec.ts`
- This report

Agent D made no application-source, Firestore Rules or existing diary-test changes. Root later fixed the two review findings and extended the sticker browser suite. Logs are local ignored artifacts: the original `artifacts/sticker-qa-e2e.log`, `artifacts/sticker-qa-rules.log` and final `artifacts/sticker-final-e2e.log`; browser screenshots/traces are under ignored `test-results/`.
