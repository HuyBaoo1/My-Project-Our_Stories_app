# Sticker integration — independent review

Date: 2026-11-05. Scope: [STICKER_PHASE1_PLAN.md](STICKER_PHASE1_PLAN.md), under the user's explicit instruction to remain in Phase 1. The broader [master prompt](handoff/STICKER_MASTER_PROMPT.md) does not authorize implementing production Firebase in this iteration.

Fixed point: `cdf4b2ef53a28633be701a019ffda8d2583bc80f`.
Initial integrated commit: `62d15e3b2149f9718c28c3847fe8f6d426859735`.
Final reviewed code: `404d997b2949f4b0882509c1e2e2a84120a83dfc`.

```text
git diff cdf4b2ef53a28633be701a019ffda8d2583bc80f...404d997b2949f4b0882509c1e2e2a84120a83dfc
git log cdf4b2ef53a28633be701a019ffda8d2583bc80f..404d997b2949f4b0882509c1e2e2a84120a83dfc --oneline
```

Real independent Standards and Spec sub-agents reviewed these axes separately. An initial usage-limit interruption was followed by successful resumed reviews; a failed agent turn was not counted as a completed review. Reviewers inspected source and tests, and the Spec reviewer additionally ran the 29 feature/catalog unit cases on the initial integration. Final full-suite runs are recorded in [STICKER_QA.md](STICKER_QA.md); reviewers did not independently rerun the final full suite.

## Standards

Documented standards: **0 findings** across final scope `cdf4b2e...404d997`.

Judgment-call smells: **0 actionable findings** against the supplied Fowler baseline.

Reviewed the incremental fix `62d15e3...404d997`: the calendar retains assigned stickers under author filtering and distinguishes unknown legacy attribution. No standards regression found.

Standards sources included `AGENTS.md`, Phase 1 guardrails and the scoped sticker contract. The user's authorization of static, locally extracted assets takes precedence over the old blanket no-image instruction. Tooling-enforced issues were not duplicated as review findings.

No files changed or final tests run by the Standards reviewer. Root's executed QA results were not independently rerun.

**Standards total: 0; worst severity: none.**

## Spec

Initial integration had two actionable findings, both now **closed**:

1. **Medium — closed:** `src/app/pages.tsx:30` skipped a day with an assigned sticker when the author filter produced zero visible notes. This conflicted with the scoped contract: “Calendar and day detail resolve the same day-level sticker ID, independent of the author filter.” Final code retains the shared sticker, including after all notes are hidden; counts and previews still follow the filter.
2. **Low — closed:** `src/features/stickers/CalendarDaySticker.tsx:11` labeled every null sticker `Chờ chọn`, including legacy days with unknown first-writer attribution and no eligible picker. This conflicted with “pending/legacy states honest.” Final code propagates `legacyUnknown` from page summary through the calendar and displays `Chưa rõ`; day detail retains its explanation and offers no picker.

Both fixes have browser regression assertions at desktop and mobile widths. The reviewer inspected commit `404d997`; **no unresolved scoped Spec findings or new Critical/High defects** were identified. Production Firebase behavior remains explicitly deferred. No scope creep was found.

Root's actual final validation: lint/typecheck/build passed, 50 unit tests and 32 browser tests passed. The unchanged deny-all emulator suite previously passed 24 tests. These results do not prove concurrent Firestore first-note assignment or positive membership authorization.

**Spec total: 2 initial findings, 0 unresolved; worst initial severity: Medium, closed.**

## Earlier architecture review

Agent E's initial independent architecture review found one additional **Medium**, resolved before the full QA run: an image still loading could be confirmed and then fail after immutable assignment. `StickerPicker.tsx:31` and `:69` now require a successfully loaded selected thumbnail; the delayed-failure browser regression passes on both viewports.

That review also inspected first-writer immutability, mock actor binding, unknown legacy migration, deletion retention, common calendar/day IDs, original-pixel asset extraction and the explicit Firebase deferral. It did not find Critical/High defects in this Phase 1 scope.

## Remaining release limits

This is a local prototype, not an authentication/security boundary or a concurrent database. First-writer Firestore transactions, membership/catalog enforcement Rules, real contention tests, backup/restore and production approval remain future gates. Existing dependency audit findings are documented in `PHASE_1_REPORT.md` and were not introduced or resolved by this change. The source image's distribution rights remain unverified; the owner must confirm rights before production distribution.

Standards: **0 findings, no worst issue**. Spec: **2 initial / 0 unresolved findings; worst initial issue Medium, closed**.
