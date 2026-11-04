# Tests to write before real use

Checked boxes mean tests already executed for Phase 1; the report contains actual results. Unchecked cases remain required for later phases, not silently assumed complete.

## Phase 1 baseline

- [x] Strict TypeScript, lint and static build.
- [x] Date validity, leap year, historical day selection and Vietnam midnight.
- [x] JSON formatting round-trip, allowed schema/marks/links, XSS URL rejection, text limits.
- [x] Mock independent notes, sequential revision conflict, history, soft-delete and local storage errors.
- [x] Firestore Emulator: deny-all get/list/create/update/delete for anonymous and Google identities across diary, member, invite, day, note and revision paths (24 tests, each exercising five operations).
- [x] Browser: desktop 1440px/mobile 360px, month/day navigation, history, rich text save/reload, drafts, edit history/soft-delete, unsafe links, conflict retention, invalid routes and mock-only join (18 tests).

## Phase 2 — authentication, invites and membership

- [ ] T1: anonymous denies all private get/list/write operations, including known document IDs.
- [ ] T2: signed-in verified Google nonmember cannot read diary metadata, day summaries, notes or revisions.
- [ ] Other providers, unverified email and malformed auth claims are denied.
- [ ] T3: exact valid same-diary invite permits self-join exactly once; existing member routes directly to calendar.
- [ ] Missing, malformed, expired, revoked and cross-diary invite tokens deny membership creation.
- [ ] T4: forged UID, self-assigned owner/admin, wrong status, extra fields and invalid timestamps are denied.
- [ ] T5: owner revocation immediately prevents subsequent new joins; listing invites remains denied.
- [ ] T6: revoked member cannot read/create/edit even with a valid Google token or old invite; cannot self-reactivate.
- [ ] Nonowner cannot revoke members/invites, change diary owner, promote self or edit immutable member identity.
- [ ] Popup success, blocked popup and mobile redirect fallback; avoid logging invite URLs/PII.
- [ ] Refresh of auth and membership, listener permission errors, logout cleanup, token removal from history.

## Phase 3 — Firestore data, concurrency and rendering

- [ ] T7: independent concurrent note creation by two accounts preserves both notes.
- [ ] T8: transactions editing different notes preserve both; summary contention remains bounded.
- [ ] T9: stale same-note edit fails; draft survives re-render, rejected save, reload and navigation; deliberate merge is required.
- [ ] Revision increases exactly 1; author/createdAt/path date remain immutable.
- [ ] Edit without paired revision snapshot is denied; wrong content, revision ID, actor or timestamp is denied.
- [ ] Fake standalone snapshot, snapshot update and snapshot delete are denied.
- [ ] Soft-delete preserves old content and snapshot; hard-delete is denied for all normal clients.
- [ ] Arbitrary clients cannot bypass field/type/size constraints; invalid stored rich trees render safely.
- [ ] T10: persisted multiline, empty paragraph, hardBreak, nested lists, bold/italic/link/emoji round-trip in real SDK, mobile and desktop.
- [ ] Paste HTML with script/image/unsafe attributes/URLs; renderer executes no script, requests no image and keeps supported text.
- [ ] T11: create today for last month keeps original selected dayKey after editing/redeploy.
- [ ] Real leap days, supported date bounds, device timezones and midnight do not move content between days.
- [ ] Month query reads only bounded summaries; day query uses pagination; listeners unsubscribe on navigation/logout/revocation.
- [ ] Verify rule access-call budgets for combined writes and concurrent day summaries; real emulator coverage report reviewed.
- [ ] Network failure/storage-disabled/quota error preserves draft; no misleading synced/saved state.

## Phase 4/5 — history, backup and release

- [ ] T12: owner-only paginated JSON export includes all historic dates, notes, soft-deleted content and revisions.
- [ ] Emulator restore drill reproduces formatting/dayKeys/revisions without duplicates or unsafe imported content.
- [ ] Two-browser/two-account end-to-end test on approved Firebase setup; 11–50 participant quota estimates updated from measurements.
- [ ] Public-source/private-repo decision resolved; secrets and private fixtures absent from history.
- [ ] Dependency audit findings resolved or explicitly assessed for the intended environment.
- [ ] Google authorized domains, Spark/default Standard DB, no billing/paid products, no Storage, approved Hosting-only deployment plan.
- [ ] No horizontal overflow at 360/1440px, keyboard focus/trapping, screen-reader labels, contrast and touch targets reviewed on real devices.
- [ ] Owner approves provisioning/OAuth/production writes/deployment before those actions occur.
