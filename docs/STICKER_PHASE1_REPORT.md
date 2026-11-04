# Sticker assets và người viết đầu tiên — báo cáo Phase 1

Ngày: 2026-11-05. Phạm vi: [kế hoạch Phase 1](STICKER_PHASE1_PLAN.md), áp dụng yêu cầu tiếp tục Phase 1 lên [master prompt](handoff/STICKER_MASTER_PROMPT.md). **UI đang chờ duyệt; chưa chuyển sang Phase 2.**

## Kết quả triển khai

- Tách 15 sticker gốc bằng xử lý local, tạo 15 PNG RGBA, 15 thumbnail tối đa 96px, contact sheet và catalog IDs `sticker-001`…`sticker-015`.
- Giữ pixel RGB gốc của bản full; chỉ thêm alpha. Không gửi ảnh tới dịch vụ ngoài, không tạo phần hình bị che. Kích thước full 220–228 ×222–229px; full PNG tổng 1.289 MB, thumbnails tổng 294 KB. Chi tiết theo ID và phương pháp ở [STICKER_ASSETS.md](STICKER_ASSETS.md).
- Dữ liệu ngày có attribution và một representative sticker độc lập với note. Người lưu ghi chú đầu tiên ở ngày mới được quyền chọn một lần. Chưa chọn thì pending; không lấy emoji trong note làm sticker tự động.
- Kiểm tra mock actor, first-writer UID và catalog ID; không có admin override. Ghi chú sau không đổi attribution. Soft-delete một hoặc toàn bộ note vẫn giữ metadata/sticker.
- Notes và metadata ghi cùng một versioned localStorage envelope; lỗi lưu không phát trạng thái thành công. V1 note arrays migrate giữ nguyên rich text; nếu không có thứ tự commit cũ thì attribution được đánh dấu unknown, không tự nhận quyền.
- Calendar dùng thumbnail theo cùng ID với header trang ngày. Picker có modal/focus/Escape, radio keyboard, trạng thái tải/lỗi và xác nhận rõ ràng. Bìa giữ thiết kế cobalt và dùng ảnh đồ uống từ catalog.

## File chính

| Nhóm | File/thư mục |
| --- | --- |
| Assets | `public/stickers/`, `public/stickers/thumbs/`, contact sheet, metadata JSON |
| Tái tạo/catalog | `scripts/extract-stickers.py`, `src/features/stickers/stickerCatalog.ts` |
| Dữ liệu/mock | `src/features/stickers/day-metadata.ts`, `src/features/notes/mock-store.ts`, `src/types/diary.ts` |
| UI | Các TSX/CSS trong `src/features/stickers/`; tích hợp ở pages, calendar, date cover, day panel và main stylesheet |
| QA/spec | Unit/browser tests, `docs/STICKER_QA.md`, tài liệu thiết kế/phạm vi và master prompt được lưu trong handoff |
| Hướng dẫn | `AGENTS.md` cho phép static assets được yêu cầu; README và báo cáo Phase 1 chỉ đường tới cập nhật mới |

## Kiểm tra và review

| Kiểm tra | Kết quả thực thi |
| --- | --- |
| Lint / strict typecheck | PASS, exit 0 |
| `npm run build` | PASS, Vite 8.3.5, 2149 modules |
| `npm test` | PASS, 5 files / 50 tests |
| `npm run test:e2e` | PASS, 30 tests: 20 regression cũ + 10 sticker scenarios trên desktop1440/mobile360 |
| `npm run test:rules` | PASS, 1 file / 24 tests; chỉ chứng minh deny-all |
| PNG/thumbnail validation | 15 IDs, alpha/antialias, kích thước/thumbnails đúng, RGB crop khớp nguồn |
| Built preview | HTTP 200; chọn/xác nhận sticker và đối chiếu ID lịch/ngày; không tràn ngang, không page error hoặc request ngoài trong flow QA |

Tổng **104 automated tests PASS**. Xem [báo cáo QA](STICKER_QA.md) để đọc output thực tế và giới hạn; không cộng kiểm tra pixel thủ công vào con số automated tests. Lượt asset test đầu giả định thumbnail vuông 96×96 đã được sửa vì thumbnail phải giữ tỉ lệ nguồn, sau đó toàn bộ unit tests qua.

Review kiến trúc độc lập ban đầu chưa thấy Critical/High. Một Medium đã được sửa trước QA: phải đợi thumbnail đã tải thành công mới cho xác nhận, tránh gán vĩnh viễn ảnh chưa xem rồi tải lỗi. Test tải chậm/thất bại đã qua trên desktop/mobile. Review Standards/Spec cuối sẽ được ghi sau khi kiểm tra commit tích hợp.

Các agent thật đã tham gia theo wave: A asset extraction, B UI, C business/data design, D QA và E independent review. Không mô phỏng agent hoặc chạy năm child đồng thời khi môi trường chỉ có bốn slots gồm root.

Ảnh duyệt UI local (gitignored `artifacts/`): `sticker-calendar-desktop.png`, `sticker-calendar-mobile.png`, `sticker-day-mobile.png`, `sticker-picker-desktop.png`, `sticker-picker-mobile.png`. Contact sheet đi cùng bộ assets: `public/stickers/contact-sheet.png`.

## Giới hạn và việc chưa thực hiện

- Đây là mock, chưa có Google identity hoặc active diary membership. Kiểm tra actor local không phải ranh giới bảo mật; JavaScript/localStorage có thể bị người dùng thay đổi.
- localStorage không có transaction đồng thời giữa các tab/thiết bị. Chưa xác minh race hai Firebase client; không khẳng định đã có đúng một winner trong Firestore.
- First-note transaction, paired day/note rules, verified Google + exact membership, malicious payloads và real transaction failure là phần tương lai chưa triển khai. `firestore.rules` vẫn deny-all; đề xuất và test cần viết nằm ở [FIRST_WRITER_DESIGN.md](FIRST_WRITER_DESIGN.md).
- Không provision project, OAuth, production write, push source public hoặc deploy. Không thêm Storage, Functions, billing hay dịch vụ ảnh trả phí.
- JPEG gốc có nền phẳng và mép ly chạm nhau. Sticker-010 bị sticker-011 che một phần viền; chỉ giữ phần nhìn thấy, không dựng lại. Cần duyệt contact sheet trên nền sáng/tối trước phát hành.
- Không có thông tin license/provenance của ảnh gốc; chủ repo cần xác nhận quyền phân phối trước production. Các file mới chưa được push lên repo public.
- Dependency audit từ Phase 1 trước vẫn là điểm mở; không thay dependency trong lượt này. Backup/restore và kiểm thử thiết bị thật vẫn chờ các phase được duyệt sau.

## Duyệt và bước tiếp theo

Chạy `npm run dev`, mở một ngày trống, lưu note rồi chọn sticker; so sánh lịch và trang ngày, thử reload và ẩn note. Xem contact sheet, ảnh QA và báo cáo test/review. Chỉ sau khi chủ repo duyệt mới lên kế hoạch phần Firebase; chưa có phê duyệt provisioning hoặc triển khai production.
