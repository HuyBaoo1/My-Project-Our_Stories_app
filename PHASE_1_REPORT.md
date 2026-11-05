# Our Stories — Báo cáo Phase 0/1

Ngày thực hiện: **2026-11-05**, múi giờ `Asia/Ho_Chi_Minh`.

**Cập nhật UI:** giao diện đầu tiên chưa được chủ repo duyệt. Giao diện đã được thiết kế lại theo reference CapLog; trạng thái vẫn **chờ duyệt UI**, chưa được phép sang Phase 2. Kết quả và ảnh kiểm tra mới nằm trong [UI_REDESIGN.md](docs/UI_REDESIGN.md). Các số liệu kiểm tra bên dưới ghi lại lượt triển khai Phase 1 ban đầu.

**Cập nhật sticker:** tiếp tục Phase 1 theo yêu cầu mới, thêm 15 static PNG và luồng chọn sticker/người viết đầu tiên trong mock. Phạm vi và interface được ghi ở [STICKER_PHASE1_PLAN.md](docs/STICKER_PHASE1_PLAN.md); thiết kế Firebase tương lai ở [FIRST_WRITER_DESIGN.md](docs/FIRST_WRITER_DESIGN.md), không thay rules deny-all hoặc kết nối Firebase thật.

Báo cáo sticker cuối: [STICKER_PHASE1_REPORT.md](docs/STICKER_PHASE1_REPORT.md), với 106 tests đã qua và [review hai trục](docs/STICKER_REVIEW.md) đã xử lý các finding trong phạm vi Phase 1. Các số liệu 63 tests bên dưới là lịch sử của lần scaffold ban đầu.

**Kết quả:** đã triển khai skeleton và giao diện mock của Phase 1; lint, strict typecheck, build và 63 automated tests đã qua. **DỪNG để duyệt**, chưa chuyển sang Phase 2. Phase 0 đã có ma trận yêu cầu, quyết định UI và đề xuất schema/rules; thiết kế bảo mật vẫn cần review, chưa được xem là đã nghiệm thu.

## Đã hoàn thành

- Đọc đủ 11 file handoff, giữ nguyên bản gốc trong `docs/handoff/`; dùng `AGENTS.md` ở root với đường dẫn tài liệu phù hợp repo.
- [Ma trận yêu cầu/rủi ro](docs/REQUIREMENTS_MATRIX.md), [đề xuất Firestore](docs/FIRESTORE_PROPOSAL.md), [checklist tests tiếp theo](docs/TESTS_TO_WRITE.md).
- Vite + React + TypeScript strict, Tailwind Vite plugin, tokens/shadcn-style Radix Button, router, FullCalendar Standard v6, Tiptap OSS v3 và Firebase SDK. Các dependency trực tiếp đã pin đúng phiên bản cài và giữ `package-lock.json`.
- Giao diện tiếng Việt, tông giấy/olive: sidebar, lịch tháng, panel ngày desktop, trang ngày mobile, trạng thái trống, `/join` placeholder và trang giải thích bản thử nghiệm.
- Các route: `/calendar`, `/day/:dateKey`, `/join`, `/join/:diaryId/:inviteToken`, `/about`; ngày không hợp lệ và trang không tồn tại có đường quay lại lịch.
- Fixture hư cấu tập trung trong `src/mocks/fixtures.ts`; không có nhật ký, email, tài khoản hoặc invite thật.
- Mock ghi chú độc lập theo ngày: thêm, chỉnh sửa, JSON rich text, snapshot phiên bản, kiểm tra revision tuần tự và soft-delete. Đây là **minh họa local**, không phải Firestore CRUD hoặc bảo đảm cộng tác giữa các tab/thiết bị.
- Renderer React có whitelist cấu trúc, giới hạn 10.000 ký tự/60 KB JSON và link HTTP(S); không dùng raw HTML. Tiptap tắt node/mark ngoài phạm vi, không có ảnh/file.
- Mock lưu ở `localStorage`; bản nháp ở `sessionStorage`, giữ nguyên khi lỗi/xung đột. Lưu note là hành động rõ ràng, không ghi backend theo phím bấm. Nội dung local có thể mất khi xóa dữ liệu trình duyệt; không dùng làm backup.
- Firebase config demo, `.env.example`, Auth/Firestore/Hosting emulator config, default project `demo-our-stories`, Firestore **deny-all** và SPA rewrite. Initializer SDK nằm riêng, chỉ cho phép demo emulator, không được UI mock import.
- Script emulator chỉ truyền các biến môi trường cần để chạy local, tránh kế thừa cloud token/production config/DEBUG vào log CLI. Không có `firebase login` hoặc credential thật.

## File thay đổi

| Nhóm | File/thư mục |
| --- | --- |
| Giữ lại cấu hình Git | `.gitattributes`; cập nhật `.gitignore`, `README.md` |
| Toolchain | `package.json`, `package-lock.json`, `.nvmrc`, `.oxlintrc.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts` |
| App/UI | `index.html`, `components.json`, `src/app/`, `src/components/`, `src/index.css`, `src/main.tsx` |
| Domain/mock | `src/types/`, `src/lib/date/`, `src/lib/rich-text.ts`, `src/features/notes/`, `src/mocks/` |
| Firebase local | `src/lib/firebase/client.ts`, `.env.example`, `.firebaserc`, `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `scripts/firebase-emulators.mjs` |
| QA/docs | `tests/unit/`, `tests/firestore-rules/`, `tests/e2e/`, `AGENTS.md`, `docs/`, báo cáo này |

## Kiểm tra thực tế

Môi trường: Windows, Node **24.13.0**, npm **11.16.0**, Java **25.0.3**. Chromium của Playwright; mobile là viewport/touch emulation, chưa phải kiểm tra trên iPhone/Android thật.

| Lệnh/kiểm tra | Kết quả cuối |
| --- | --- |
| `npm install` dependencies + devDependencies | Exit 0; dependency audit có cảnh báo, xem dưới |
| `npx playwright install chromium` | Exit 0 |
| `npm run lint` | Exit 0, không lỗi/cảnh báo lint |
| `npm run typecheck` | Exit 0; app, config và test files đều typecheck |
| `npm run build` | Exit 0; Vite 8.3.5, 2139 modules; tạo `dist/` |
| `npm test` | Exit 0; **3 files, 21 tests passed** |
| `npm run test:rules` | Exit 0; **1 file, 24 tests passed** trên Firestore Emulator Standard v1.22.0 |
| `npm run test:e2e` | Exit 0; **18 passed**, desktop 1440×1000 và mobile 360×800 |
| Build preview + Chromium smoke | HTTP 200; lịch, trang ngày, editor save, không tràn ngang ở hai kích thước; 0 page errors, 0 external requests trong flow đã chạy |
| `npm audit fix` | Exit 1; áp dụng phần sửa tương thích nhưng còn **19 findings: 14 moderate, 5 high** |

Trích output thực tế của các lượt cuối:

```text
> our-stories@0.0.0 lint
> oxlint --deny-warnings src tests scripts vite.config.ts vitest.config.ts playwright.config.ts

> our-stories@0.0.0 typecheck
> tsc -b && tsc -p tsconfig.tests.json

Test Files  3 passed (3)
     Tests  21 passed (21)

vite v8.3.5 building client environment for production...
✓ 2139 modules transformed.
✓ built in 837ms

Test Files  1 passed (1)
     Tests  24 passed (24)
+ Script exited successfully (code 0)

18 passed (45.0s)

PASS: built SPA HTTP 200, desktop/mobile layout, day navigation, editor save,
no runtime errors or external requests.

19 vulnerabilities (14 moderate, 5 high)
```

Lượt kiểm thử trình duyệt ban đầu có 1 ca fail vì locator bắt trùng excerpt và nội dung panel; đã giới hạn locator vào vùng nhật ký rồi chạy lại toàn bộ, 18/18 qua. Typecheck/lint phát hiện các lỗi cấu hình/cú pháp ban đầu; các lỗi đó đã sửa trước các lượt pass cuối. Lượt smoke đầu qua PowerShell stdin bị mất dấu trong selector; chạy lại bằng selector ASCII đã xác nhận build hoạt động. Không coi các lượt fail ban đầu là pass.

Emulator có các log `PERMISSION_DENIED` mong đợi và dừng bằng SIGINT sau test; 24 ca đều xác nhận get/list/create/update/delete bị từ chối, kể cả Google user và member/owner đã seed. **Không có test nào trong số này chứng minh membership, invite hoặc revision rules tương lai hoạt động.** Auth/Hosting emulator được cấu hình nhưng chưa chạy luồng Google hoặc test Hosting emulator; preview dùng Vite phục vụ build tĩnh.

Ảnh QA local, không chứa dữ liệu thật (thư mục `artifacts/` được gitignore):

- `artifacts/phase1-desktop.png`
- `artifacts/phase1-mobile.png`
- `artifacts/phase1-mobile-day.png`

Cơ chế tự động duyệt lệnh từ chối dọn thư mục `.phase1-scaffold/` với lý do `blocked by policy`; thư mục tạm được để nguyên và đã gitignore, không tham gia build hoặc commit.

## Chưa triển khai / chưa xác nhận

- Google Authentication thật, mobile redirect fallback, join bằng token, owner bootstrap, membership/revocation và quyền admin.
- Security Rules cho các luồng trên; bản runnable vẫn deny-all. Không có lời khẳng định bảo mật production.
- Firestore note CRUD, transaction đồng thời nhiều tài khoản, `onSnapshot`, pagination và unsubscribe thực tế.
- Revision/snapshot atomic enforcement, count integrity, soft-delete/restore trên Firestore.
- Owner JSON export, kiểm tra backup/import/restore, real-device walkthrough và accessibility audit đầy đủ.
- Firebase project, region, default Standard database, OAuth authorized domains hoặc Hosting production.
- Chưa đổi repo public sang private. Source mới chỉ commit local; chưa push lên public GitHub trong phase này.
- Thiết lập Matt Pocock issue tracker/triage labels vẫn chờ lựa chọn trước đó; prompt Phase 1 không được xem là câu trả lời thay cho lựa chọn ấy.

## Dependency audit

Sau `npm audit fix` không ép major, còn 19 dependency findings (nhiều mục là cùng vấn đề được lan qua dependency cha). 5 high nằm trong chuỗi Firebase/Firestore → Node `@grpc/grpc-js` cũ; moderate chủ yếu thuộc toolchain Firebase CLI như glob/minimatch/uuid/OpenTelemetry. `npm` đề nghị force đổi major/downgrade Firebase và CLI; chưa áp dụng vì sẽ đổi stack đã kiểm tra.

UI mock không import initializer Firebase và flow browser đã kiểm tra không gọi dịch vụ ngoài. Điều đó **không** làm dependency audit thành pass hoặc xác nhận an toàn cho việc dùng SDK production. Cần đánh giá/bản vá upstream hoặc override có kiểm thử trước phase dùng Firebase thật. Audit là điểm còn mở, không phải yêu cầu kích hoạt dịch vụ trả phí.

## Free-tier và quota

Phase 1 dùng local mock và emulator, không phát sinh read/write Firestore production, không có hosting deploy hay dịch vụ hạ tầng mới.

Trước khi dùng thật phải đo số initial reads, listener changes, rule lookups, transaction retries, snapshot storage và lượt tải bundle. [Firestore free quota](https://firebase.google.com/docs/firestore/pricing) hiện công bố 1 GiB lưu trữ, 50.000 reads/ngày, 20.000 writes/ngày và 10 GiB outbound/tháng cho database đủ điều kiện; [Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing) có mức miễn phí 10 GB storage và 10 GB transfer/tháng. Recheck tại lúc duyệt triển khai; không hứa 50 người sẽ luôn nằm trong quota.

Bundle build hiện khoảng 1,02 MB JS trước gzip, chia calendar/editor/app; tổng JS gzip khoảng 320 KB. Đây là đo kích thước build, không phải đo lưu lượng production. Cần theo dõi quota ngay cả khi text nhỏ: history nhân bản nội dung, metadata/index có overhead, listeners tốn reads và Hosting lưu nhiều release.

## Kế hoạch tiếp theo — chỉ sau khi duyệt

1. Chủ repo review Phase 1, chọn private-source workflow và giải quyết dependency findings cho phần sắp dùng.
2. Duyệt kế hoạch Phase 2: Firebase Spark, region/default Standard DB, trusted owner bootstrap, Google-only provider, invite/membership schema. Chưa xin hoặc dùng admin keys trong frontend.
3. Viết positive/negative emulator tests cho Google identity, exact diary membership, invite expiry/revocation, self-promotion và schema trước khi mở quyền tương ứng.
4. Sau khi Phase 2 được nghiệm thu mới triển khai Firestore calendar/day data và revision concurrency của Phase 3; export/restore trước khi dùng thật.

**STOP:** điểm 10 của [prompt Phase 0/1](docs/handoff/CODEX_PROMPT_PHASE_0_1.md) yêu cầu: “Ask for approval before provisioning Firebase, real Google OAuth setup, production writes, or deployment.” Các thao tác này chưa thực hiện. Cần chủ repo duyệt trước khi tiếp tục; không bật billing, Blaze, Functions, App Hosting, Storage hoặc paid extensions.
