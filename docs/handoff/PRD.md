# PRD — Shared Diary v1.0

## 0. Metadata

- Product: Shared Diary
- Version: 1.0 / Proposed MVP
- Date: 2026-11-05
- Environment: browser desktop + mobile, PWA install optional
- Target: 11–50 users, friends/family, non-commercial
- Language: Vietnamese UI first
- Timezone: `Asia/Ho_Chi_Minh`
- Cost guardrail: zero paid infrastructure; Firebase Spark only

## 1. Product vision

Một cuốn nhật ký chung theo lịch tháng. Mỗi ngày là một trang, có nhiều note của các thành viên. Thành viên truy cập bằng đường link, xác thực qua Google cá nhân và tự gia nhập nếu invite token hợp lệ. Tất cả thành viên có quyền xem mọi note trong workspace, có thể đóng góp/chỉnh sửa trang chung, và truy cập lại lịch sử nhiều tháng/năm sau.

## 2. Personas

- **Owner/Admin:** tạo nhật ký; chia sẻ/vô hiệu hóa link; xem/quản lý thành viên; xuất dữ liệu; quản lý note.
- **Member:** sử dụng link, login Google, tạo note, đọc note, chỉnh sửa nội dung chung, duyệt lịch sử.
- **Unauthenticated:** chỉ thấy trang login/đề nghị truy cập; không đọc note hoặc metadata riêng.

## 3. User journeys

**Join:** click `.../join/<diaryId>/<randomInviteToken>` -> Google login -> verify token via Firestore rules -> create membership in transaction/safe create -> redirect `/calendar` to current month. Existing member goes directly to calendar. If token revoked/invalid: show expired invite message.

**Read:** Calendar month -> date cell shows presence/count and short excerpt -> click date -> display full daily page with ordered note cards, author and time, full rich-text formatting -> previous/next day.

**Create:** click date -> add note -> type rich text -> save -> note appears in that date for other members via Firestore listener. New note is one independent document.

**Edit:** any member can click edit on a note -> load version -> edit -> commit transaction only if current revision equals base revision; on conflict, keep local draft and show a comparison/refresh path; do not silently overwrite.

**History:** can navigate any supported month and date; all historical notes remain pinned to original date. Editing note optionally writes a revision history record; when revisions are enabled in MVP, it is mandatory to test version retention.

## 4. Functional requirements

| ID | Requirement | Priority | Acceptance |
|---|---|---|---|
| FR-01 | Google personal account sign-in | P0 | Signed-in users have verified Google identity |
| FR-02 | Secret-link join; no allowlist/manual approval | P0 | New Google user with valid invite joins; no token -> denied |
| FR-03 | Membership + admin revoke | P0 | Non-member/removed member cannot read or write diary |
| FR-04 | Big monthly calendar home | P0 | Month navigation and date selection desktop/mobile |
| FR-05 | Exactly one shared daily page | P0 | All note blocks under same date are shown together |
| FR-06 | Multiple note blocks per date | P0 | Two users can create notes concurrently without overwrite |
| FR-07 | Rich text preservation | P0 | Paragraphs, newlines, bold, italics, lists, links, emoji survive save/reload |
| FR-08 | Collaborative page editing | P0 | Members can edit notes; same-note edit conflict is detected |
| FR-09 | Historical navigation | P0 | Old notes accessible in original date, including after redeploy |
| FR-10 | Realtime updates | P0 | New note in open day appears on other connected devices |
| FR-11 | Responsive UI | P0 | Mobile 360px and desktop 1440px, no horizontal overflow |
| FR-12 | Soft deletion | P0 | Deleted note cannot disappear irrecoverably through common UI |
| FR-13 | Plain JSON export | P1 / prior to real usage | Owner downloads full diary and validates content |
| FR-14 | Import/restore drill | P1 / prior to real usage | Restore a sample export in emulator; no duplicates |
| FR-15 | Search / full revision diff / comments | Later | Explicitly excluded from MVP unless quick to add |

## 5. Non-functional requirements

- **Cost:** no paid tiers. Avoid features that require Blaze; no server infrastructure.
- **Security:** Firestore Rules enforce all permissions and schema; deny by default; test using emulator.
- **Durability:** note history persisted in Firestore, export JSON; no reliance on local browser state for source-of-truth.
- **Responsiveness:** usable from laptop, desktop, Android and iPhone browsers; accessible inputs and contrast.
- **Performance:** only fetch the month summary and notes for selected day; unsubscribe listeners when not in use; avoid querying entire note history on calendar render.
- **Consistency:** per-note optimistic revisioning; no last-write-wins silent overwrites for concurrent edits; dayKey stable independent of createdAt.
- **Portability:** JSON export contains rich document tree and dates, independent of Firebase SDK versions.
- **Privacy:** no public diary content, Google-only accounts, user consent about link sharing, no external analytics by default.

## 6. UX principles

- Desktop: large 7-column calendar; show presence/count of notes and short excerpts; right-side daily panel or full-day route.
- Mobile: calendar cells compact with dots/count; tapping opens a full-screen day view; single floating add-note button.
- Daily page: cards sorted chronologically, author initials, display name, HH:mm, full rich formatting, edit history indicator.
- Rich editor toolbar: bold, italic, bullet, numbered list, link, undo/redo. No image/file buttons.
- Explicitly mark `Đang lưu`, `Đã lưu`, `Chưa đồng bộ`, `Xung đột chỉnh sửa`.
- Never truncate note content in day detail. Calendar previews may truncate visually, without changing stored content.

## 7. Scope exclusions

- No image upload / object storage.
- No public discovery, no search-engine indexing of diary content.
- No Google-Docs-level same-paragraph multi-cursor co-editing.
- No native iOS/Android binaries, no push notifications.
- No email delivery service, automatic backup service, payments, AI features.

## 8. Remaining assumptions

- One diary/workspace for the first release; data schema is future-ready for multiple.
- Any person **holding a valid invite link** and logging in with Google may join, until token is revoked.
- Members are trusted socially; edits allowed to shared notes, with revisions/soft-delete safeguards.
- Backdated notes are allowed. Display timezone is Vietnam.

## 9. Definition of Done

- Automated tests pass for auth, invitation, permissions, note CRUD, date logic and collision handling.
- Manual 2-browser / 2-account end-to-end walkthrough passes.
- Reopen last month's rich-text note and verify formatting lossless.
- Export and sample restore verified; no real diary test data shared publicly.
- Deploy on Firebase Hosting Spark, domain `*.web.app`, no billing enabled.
