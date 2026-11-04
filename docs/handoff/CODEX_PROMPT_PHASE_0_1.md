# Copy-ready Codex Prompt — Phase 0/1 Only

You are an experienced senior full-stack engineer, security reviewer, and technical product owner.

PROJECT: Shared Diary (Private Shared Calendar Notes)
REFERENCE DOCS: README.md, PRD.md, ARCHITECTURE.md, DATA_MODEL.md, SECURITY.md, ROADMAP.md, AGENTS.md.

The user approved these requirements:
- Personal friends/family project, 11–50 participants.
- Anyone holding a valid invitation link can join after signing in with their personal Google account; no manual account approval.
- One collaborative daily page per date, made of independently stored rich-text note blocks. Each member can contribute and edit notes in the shared page.
- All members can see all notes. Historical notes must remain accessible by their original calendar dates.
- Preserve paragraph breaks, lists, bold/italic, links and emoji after storage and reload.
- No image upload, no image database, no object storage, no external paid services.
- Responsive mobile + desktop. Large month calendar as home page.
- Goal: $0 infrastructure on Firebase Spark, without billing enabled.
- Codex usage is not counted in infrastructure cost.

MANDATORY STACK:
- React, Vite, TypeScript strict
- Tailwind CSS + shadcn/ui
- FullCalendar Standard
- Tiptap Open Source starter-kit; JSON as canonical rich-text format
- Firebase Auth Google, Cloud Firestore Standard, Firebase Hosting (static SPA)
- Firebase Firestore Security Rules and Emulator Suite
- GitHub private repo for source when approved

SECURITY:
- Firebase Google authentication is NOT sufficient. Require active membership in exact diary.
- Join via cryptographically random invite-token link. Firestore rules validate invitation and forbid self-assigned admin role.
- Nonmembers have no ability to read or write content.
- No broad `allow read, write: if request.auth != null` rule.
- No client secrets or admin SDK private keys in frontend.
- Validate rich-text structure and safe links. Protect against XSS.

CONCURRENCY AND HISTORY:
- One daily page composed of separate note documents.
- Editing a note requires optimistic revision check and safe conflict handling.
- Keep the user's unsaved draft on conflicts.
- Preserve note history via soft-delete and revision snapshots; never silently overwrite.
- Avoid writing on each keystroke, minimize Firestore read/write costs.
- Real-time updates via Firestore onSnapshot, without CRDT websocket infrastructure.

FIRST EXECUTION SCOPE — DO NOT ADVANCE BEYOND PHASE 1:
1. Inspect working directory; do not overwrite existing source.
2. Read all handoff documents, produce a short requirement matrix and implementation risks.
3. Create or validate project skeleton with Vite React TypeScript strict.
4. Set up compatible Tailwind, shadcn/ui, router, FullCalendar, Tiptap and Firebase SDK.
5. Build calendar/month view and sample day note UI using local MOCK data only.
6. Add Firebase Emulator configuration and environment example WITHOUT production credentials.
7. Create a Firestore schema/rules proposal and an explicit tests-to-write checklist. Do not assert security without emulator tests.
8. Add lint/typecheck/build scripts and run them. Show real pass/fail output.
9. Write `PHASE_1_REPORT.md` with completed items, unimplemented features, quota risks and next phase plan.
10. STOP. Ask for approval before provisioning Firebase, real Google OAuth setup, production writes, or deployment.

ABSOLUTE RESTRICTIONS:
- Do not ask for or store payment card details.
- Do not enable Blaze, Cloud Functions, Firebase App Hosting, Firebase Storage, service-account keys in client or paid extensions.
- Do not deploy or delete existing resources without explicit approval.
- Do not fabricate completed tests, accounts, resources, data or production capabilities.

Acceptance for Phase 1: a locally running responsive mock calendar/day UI, strict TypeScript, no hard-coded diary content beyond explicit mock fixtures, build/lint/typecheck output and a clear stop for review.
