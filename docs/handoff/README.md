# Shared Diary — Technical Handoff v1.0

**Ngày chốt:** 2026-11-05  
**Trạng thái:** APPROVED DIRECTION / NOT IMPLEMENTED / NOT DEPLOYED  
**Mục tiêu:** ứng dụng nhật ký chung riêng tư theo ngày, 11–50 người, đăng nhập Google, chỉ văn bản, giao diện lịch lớn, mobile và desktop, mục tiêu $0 chi phí hạ tầng.

## Kiến trúc đã chọn

| Lớp | Công nghệ |
|---|---|
| Frontend | React + Vite + TypeScript (strict) |
| UX | Tailwind CSS, shadcn/ui, FullCalendar Standard, Tiptap StarterKit |
| Authentication | Firebase Authentication (Google only) |
| Database + realtime | Cloud Firestore (Standard edition, default database) |
| Hosting | Firebase Hosting (static SPA, .web.app) |
| Environment | Firebase Spark (no billing enabled) |
| Source / QA | Private GitHub repo, Vitest, Playwright, Firebase Emulator, Codex |

**Chủ ý không dùng:** Next.js, backend server, Cloud Functions, Supabase, PostgreSQL, Vercel, ảnh upload, object storage, dịch vụ trả phí, realtime character-by-character editing.

## Phân biệt cộng tác

Mỗi ngày có **một trang nhật ký chung**, bên trong gồm nhiều **note blocks** (tin nhắn/ghi chú). Thành viên có thể thêm note và chỉnh sửa note trong trang ngày; cùng sửa *hai note khác nhau* được đồng bộ riêng. Nếu hai người sửa *một note cùng lúc*, MVP phát hiện version conflict và yêu cầu xem lại; **không** hứa live collaborative cursor như Google Docs.

## Tài liệu trong gói

- `PRD.md`: Yêu cầu sản phẩm, UX, hành vi, tiêu chí nghiệm thu.
- `ARCHITECTURE.md`: Kiến trúc, decision record, chiến lược quota, realtime.
- `DATA_MODEL.md`: Cấu trúc Firestore, versioning, index, quy tắc dữ liệu.
- `SECURITY.md`: Google login, invite link, membership, security rules, backup.
- `ROADMAP.md`: Phases, DoD, test cases, thứ tự triển khai.
- `FIREBASE_SETUP.md`: Các bước làm thủ công trên Firebase và lệnh khởi tạo.
- `AGENTS.md`: Quy tắc cho coding agent Codex.
- `CODEX_PROMPT_PHASE_0_1.md`: Prompt khởi tạo có điểm dừng để duyệt.
- `.env.example`: Ví dụ cấu hình frontend, không chứa thông tin thật.

## Quyết định bắt buộc

1. Chỉ dùng Firebase **Spark**; không bật **Blaze**, không khai báo thẻ, không vô tình bật App Hosting/Cloud Functions.
2. Một workspace/diary; Google login; người có link mời hợp lệ có thể gia nhập tự động.
3. Cần **membership authorization** trong Firestore Rules, không chỉ 'đã đăng nhập là được'.
4. Notes dùng Tiptap JSON, không lưu raw HTML làm nguồn chân lý; phải giữ xuống dòng, danh sách, đậm/nghiêng và emoji.
5. `dayKey` theo múi giờ `Asia/Ho_Chi_Minh`, tách ngày nội dung khỏi thời điểm tạo.
6. Không có hình ảnh upload. Avatar dùng chữ cái đầu tên (không dùng image storage).
7. Không xóa cứng note lịch sử theo hành động thông thường; soft-delete và/hoặc revisions theo acceptance.
8. Trước khi sử dụng thật: có thủ tục export JSON và thử import/restore trên dữ liệu test.

## Phạm vi hiện tại

Đây là **bộ tài liệu kỹ thuật để giao cho Codex**. Chưa có source code ứng dụng, tài khoản Firebase, GitHub repo hay deploy production nào được tạo bởi bộ tài liệu này.
