# Checkpoint để tiếp tục Phase 2

Ngày lưu: **2026-11-07**, múi giờ `Asia/Ho_Chi_Minh`.

Branch: `main`. Tag checkpoint: `phase-1-checkpoint-2026-11-07`. Commit code cuối trước tài liệu bàn giao: `08086ae`.

## Trạng thái bàn giao

Phase 1 đã có frontend mock chạy local, giao diện sổ lưu niệm theo reference CapLog và bộ chọn sticker tối giản. UI vẫn chờ chủ repo duyệt; yêu cầu lưu checkpoint/push GitHub không được xem là nghiệm thu UI hoặc bắt đầu Phase 2.

- Vite/React/TypeScript strict, FullCalendar, Tiptap; ghi chú rich-text JSON và metadata ngày trong localStorage.
- Sticker chỉ có **Tự thêm** hoặc **Có sẵn**, xác nhận bằng **Dùng sticker**. Người viết đầu tiên được chọn một lần. Ảnh tự thêm chỉ gắn với ngày đã xác nhận, không thành thư viện hoặc bộ sticker dùng lại. Ảnh nháp ở bộ nhớ; ảnh gắn ngày được giữ trong IndexedDB local để hiển thị sau reload.
- Quy tắc **Keep the UI simple** đã ghi trong `AGENTS.md`. Giữ giao diện ngắn gọn khi nối backend.
- Firebase initializer tách riêng, chỉ cho project emulator `demo-our-stories`; UI mock chưa dùng initializer. Firestore Rules vẫn deny-all.
- Chưa có Google login thật, invite/membership, backend notes/realtime, owner bootstrap, backup/restore hoặc production deployment. Chưa cấp phát Firebase project hay bật billing.

## Bằng chứng kiểm tra gần nhất

Lượt code cuối ngày 2026-11-06 tại `08086ae`: lint, typecheck, build qua; **72 unit tests và 62 browser tests qua** (Chromium desktop/mobile, WebKit). Các số liệu này là lượt kiểm tra trước checkpoint, không phải lần chạy mới ngày 2026-11-07. Lượt lưu checkpoint chỉ sửa tài liệu và kiểm tra diff/Git.

Rules deny-all từng qua 24 emulator tests ở lượt Phase 1 trước; không xác nhận invite/membership tương lai. Chưa kiểm tra bàn phím sticker trên iPhone thật. Playwright WebKit và native input/paste tổng hợp không thay thế kiểm tra thiết bị thật.

Chi tiết: [báo cáo Phase 1](../PHASE_1_REPORT.md), [sticker hiện tại](PERSONAL_STICKERS_PHASE1.md), [UI](UI_REDESIGN.md). Báo cáo catalog/review cũ chỉ bao gồm phiên bản được ghi trong từng tài liệu. Artifact/log QA local nằm trong `artifacts/`, bị Git ignore và không có trên GitHub.

## Thứ tự tiếp tục khi được yêu cầu triển khai Phase 2

1. Đọc `AGENTS.md`, tài liệu này, [roadmap gốc](handoff/ROADMAP.md), [security](handoff/SECURITY.md) và [đề xuất Firestore](FIRESTORE_PROPOSAL.md). Roadmap handoff có trạng thái lịch sử “documentation only”; trạng thái hiện tại lấy từ checkpoint này và source.
2. Xác nhận thiết kế UI và phạm vi Phase 2. Thiết kế Google-only Auth, invite có expiry/revocation, membership theo từng diary và owner bootstrap tin cậy. Không dùng invite như thông tin đăng nhập, không đưa admin credentials vào frontend.
3. Rà lại dependency findings trước khi dùng Firebase SDK thật. Báo cáo trước ghi 19 findings (14 moderate, 5 high), chưa audit lại ở lượt checkpoint; không tự force đổi major/downgrade.
4. Triển khai và kiểm thử Auth/join/membership bằng emulator trước: anonymous/nonmember bị chặn; valid Google + invite được join; invite giả/hết hạn/thu hồi, tự nâng quyền, list invites và revoked member bị từ chối. Giữ deny-by-default cho các collection chưa có luồng đã kiểm chứng.
5. Chỉ cấp phát Spark project, chọn region/default Standard database, cấu hình Google OAuth thật hoặc dùng owner bootstrap sau khi chủ repo cho phép rõ các thao tác đó. Yêu cầu hiện tại chỉ cho phép commit/push và lưu checkpoint.

DoD Phase 2: valid invite + Google tạo membership hợp lệ; invite giả/nonmember bị từ chối; không self-promote/list invites; membership bị thu hồi mất quyền truy cập. Kết quả phải có emulator tests thực thi. Firestore notes CRUD/revision concurrency thuộc Phase 3; production deploy thuộc phase sau.

## Điểm còn mở

- Sticker ảnh hiện chỉ ở thiết bị đã thêm. Đồng bộ ảnh cho các thành viên cần quyết định kiến trúc riêng; không nhét base64 vào Firestore hoặc tự bật Storage/billing để lách phạm vi.
- PNG mẫu được tích hợp từ reference do người dùng cung cấp; quyền phân phối production chưa xác nhận. Xem [STICKER_ASSETS.md](STICKER_ASSETS.md).
- Repo public. Không nhập nhật ký riêng tư, thêm secrets hoặc ảnh người dùng vào source/artifact/log; không tự đổi visibility.
- Không deploy, production writes, bật Blaze/billing, Functions, App Hosting, Storage hoặc dịch vụ trả phí trong lần tiếp tục chỉ để đọc/chuẩn bị.

**Điểm dừng:** đã lưu trạng thái để tiếp tục; Phase 2 chưa triển khai. Khi chủ repo yêu cầu “tiếp tục Phase 2”, bắt đầu từ thứ tự trên, không dựng lại scaffold hoặc khôi phục thư viện sticker cá nhân.
