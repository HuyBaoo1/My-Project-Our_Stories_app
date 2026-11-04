# Implementation Roadmap — Shared Diary v1.0

## Scope control

**Project status:** documentation only. Codex should not assume Firebase has been provisioned or that source code currently exists. All features must pass acceptance before calling them COMPLETE.

### Phase 0 — Requirements, UX and architecture (design gate)

1. Read PRD/Architecture/Data Model/Security.
2. Confirm single shared diary model and Google invite-link flow.
3. Prepare mock wireframes desktop/month and mobile/day.
4. Decide note JSON schema, Firestore reads strategy and conflict presentation.
5. Review Firestore Rules feasibility for revision consistency.

**DoD:** docs reviewed, threat model and schema accepted, zero-cost design verified.

### Phase 1 — Frontend skeleton and Firebase Emulator

1. Scaffold `vite react-ts` and TypeScript strict.
2. Add Tailwind, shadcn/ui, React Router, FullCalendar Standard, Tiptap OSS, Firebase JS SDK.
3. Add environment example and emulator config, but no real credentials.
4. Create core routes `/join`, `/calendar`, `/day/:dateKey`; responsive shells using sample local data.
5. Add lint, typecheck, unit-test scripts; AGENTS.md guardrails.

**DoD:** `npm install`, `npm run build`, `npm run typecheck`, `npm run lint` pass; calendar layout works with dummy notes. Stop for review.

### Phase 2 — Google Auth, invite and membership

1. Configure Firebase project (Spark); enable Google Authentication, Firestore Standard.
2. Initialize owner via trusted one-time procedure, create secure invite token.
3. Implement Google sign-in and `/join/:diaryId/:inviteToken` flow.
4. Write Firestore security rules, explicit denied-by-default policy, tests.

**DoD:** valid invite + Google gets membership; fake invite and nonmembers denied; cannot self-promote or list invites; revoked members denied.

### Phase 3 — Calendar/day notes + formatting

1. Implement query for current month day summaries only.
2. Daily page list with realtime snapshot, chronological ordering.
3. Tiptap JSON editor, create notes, render, multiline/list/bold/italic/links/emoji.
4. Add optimistic version edits, conflict modal, soft-delete, history strategy.
5. Write unit/integration tests for day key and multi-account concurrent notes.

**DoD:** simultaneous create succeeds; same-note conflict does not overwrite silently; reload preserves full JSON formatting; old dates retain notes.

### Phase 4 — Responsive, history, export and privacy

1. Optimize layouts and keyboard access on 360px mobile + 1440px desktop.
2. Add history month navigation, month summaries and smart lazy loading.
3. Owner JSON export + emulator restore drill, all notes and revisions included.
4. Check query volume; verify onSnapshot unsubscriptions; remove unused SDK/features.
5. Optional static PWA install prompt (no offline write guarantees).

**DoD:** 2-device manual test passes, export/restore verified, no external image/storage resources.

### Phase 5 — Deploy with no billing

1. Confirm Firebase pricing = Spark, Cloud Billing not enabled.
2. Use Firebase Hosting static SPA rewrite, deploy only hosting + safe Firestore rules/indexes.
3. Test real Google Auth and Firebase authorized domain, redirect/popup on phone.
4. Verify 2 Google accounts in real browser, old notes retention and no unauthorized access.
5. Record rollback plan and baseline monthly quota dashboard.

**DoD:** live `*.web.app` reachable on desktop/mobile; identity/membership enforced; no paid services provisioned; document known limitations.

## 12 essential test cases

- T1: anonymous cannot read any diary data.
- T2: Google login without valid invite cannot see notes.
- T3: valid invite self-join works exactly once.
- T4: forging `role=owner` at join is denied.
- T5: revoked invite cannot onboard new users.
- T6: revoked member cannot read/create/edit.
- T7: two members create notes on same day without overwrite.
- T8: one edits note A and another edits B, both preserved.
- T9: two users edit same note with stale revisions -> conflict, local draft retained.
- T10: rich note formatting and emoji preserved after reload and on mobile.
- T11: notes created today for last month are displayed under selected `dayKey`, not `createdAt`.
- T12: export includes historical notes and a restore drill reconstructs selected dates.

## Required reporting from Codex after each phase

- Files added/changed.
- Commands executed and actual pass/fail outputs.
- Firebase services used and quota implications.
- Known risks, failures, and unimplemented items.
- Explicit STOP gate before paid-service activation, destructive action, secrets use, or production deploy.
