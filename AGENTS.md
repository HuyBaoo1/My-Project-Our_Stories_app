# Codex Agent Rules — Shared Diary

## Task objective

Build an invite-link-based private collaborative diary (calendar-first, text-only) for 11–50 family/friends accounts using free-tier Firebase services. Read the requirements in `docs/handoff/PRD.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `SECURITY.md` and `ROADMAP.md` (all under `docs/handoff/`). The current execution is limited to `docs/handoff/CODEX_PROMPT_PHASE_0_1.md`. See `PHASE_1_REPORT.md` for executed checks and remaining work.

## Strict non-negotiables

1. Firebase **Spark** only. Do not activate billing/Blaze or services requiring billing. Explicit permission required for any spend.
2. No cloud image uploads, object storage, Firebase Storage, Cloud Functions, App Hosting or paid extensions in Phase 1. Authorized sticker work permits the static reference PNGs and personal stickers received by paste/file selection, normalized locally and stored in device IndexedDB. No user images go into commits, logs or external services. See `docs/PERSONAL_STICKERS_PHASE1.md` for current scope; the fixed-catalog plan records the earlier iteration.
3. Stack: Vite + React + TypeScript strict + Firebase Auth + Firestore + Firebase Hosting. No Next.js / FastAPI / server by default.
4. All content access authorized using tested Firestore Rules: Google login AND active diary membership.
5. An invite link alone is not a login; Google identity alone is not membership. Require both.
6. Notes must be stored as structured rich-text JSON; preserve line breaks, lists, bold, italic, links and emoji after save/load.
7. DayKey (`YYYY-MM-DD` in Asia/Ho_Chi_Minh) is independent from server creation timestamp.
8. Page-per-day is made of independent note documents; concurrent same-note edits require revision conflict detection, not silent overwrite. Do not promise Google Docs/Yjs-style simultaneous character co-editing.
9. Preserve historical notes. No hard-delete from normal UI. Revision history and backup validation required before real use.
10. Secrets, tokens, private diary content, service-account keys and member PII must not appear in logs, prompts, commits or examples.
11. No deploy, production resource mutation, paid service, destructive command or admin credential action without explicit owner approval.
12. Every 'complete' claim requires actual executed tests and their outputs. Label mock, proposed and not-yet-tested explicitly.
13. **Keep the UI simple.** Sticker selection has two choices: add a sticker for the current day or choose an existing sample. Custom stickers belong to that day only; do not build a reusable sticker library, collection management or a separate save-to-pack flow. Persist only the image needed to display a confirmed day sticker after reload.

## Development cadence

- When resuming Phase 2, read `docs/PHASE_2_HANDOFF.md` for the saved checkpoint, latest UI decisions, validation and remaining gates.
- One roadmap phase at a time. Produce reviewable diffs and meaningful commits.
- Prefer small, auditable modules and transparent data access patterns.
- Use Firebase Emulator for security tests; test owner/member/nonmember, invite revocation, stale-edit conflicts and schema validation.
- Keep SDK initialization centralized. Unsubscribe snapshot listeners to minimize reads.
- Avoid keystroke writes. Submit notes explicitly; keep unsaved draft locally on errors.
- Prefer exact dependencies verified for compatibility; do not lock versions without checking install/build.

## Expected phase report

- Summary; changed files; test commands + outputs; open questions; free-tier impact; unresolved security risks; STOP pending next approval.
