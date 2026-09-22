## Plan: Thiệp seminar mỹ phẩm và admin

Xây dựng một thiệp mời seminar song ngữ Việt/Anh trên TanStack Start, ưu tiên màn hình di động tối đa 425px, với điểm nhấn phân tử mỹ phẩm 3D bằng Three.js/React Three Fiber và chuyển động bằng Motion. Supabase lưu khách mời, RSVP và tài khoản admin; mã mời Base62 ngắn nằm trong URL dạng `/?k=Ab3x9Q2m&l=vi`, còn tên tiếng Việt đầy đủ nằm trong database. Admin tạo link bằng origin hiện tại nên tự hoạt động trên localhost, Vercel preview và domain production.

**Steps**

### Phase 1: Nền tảng và hợp đồng dữ liệu

1. Trước khi sửa code, lưu bản handoff này thành `d:\SELF_PROJECT\SEMINAR_CARD\seminar\docs\implementation-plan.md`; không sửa các file sinh tự động trong `src/paraglide/` hoặc `src/routeTree.gen.ts` bằng tay.
2. Cài runtime dependencies `motion`, `three`, `@react-three/fiber`, `@react-three/drei`, `@supabase/supabase-js`, `@supabase/ssr`, `nanoid`, `papaparse`; thêm type package cần thiết và bộ test `vitest`, Testing Library, Playwright nếu repo chưa có. Dùng `pnpm dlx shadcn@latest` theo `components.json`, xem docs trước, rồi thêm đúng các primitive cần dùng: button, input, textarea, field, radio-group, select, table, badge, dialog/alert-dialog, dropdown-menu, skeleton, separator, tooltip và sonner. Không cài một bộ UI hoặc animation thứ hai.
3. Tạo migration Supabase cho ba bảng: `admin_users(user_id -> auth.users)`, `guests(id, invite_code unique, full_name, max_attendees default 5/check 1..5, created_by, timestamps)`, và `rsvps(guest_id unique/FK, responder_name, message, attending, attendee_count, timestamps)`. Quy ước người từ chối có `attendee_count = 0`; người tham dự có 1–5 và không vượt `guests.max_attendees`. Bật RLS, không cấp public CRUD cho bảng; service role chỉ tồn tại phía server. Thêm index cho `invite_code`, trạng thái RSVP và thời gian cập nhật, cùng seed/instruction để gán user Supabase Auth đầu tiên vào `admin_users`.
4. Mở rộng `src/env.ts` với Supabase URL, anon key và service-role key theo đúng ranh giới client/server; thêm `.env.example` không chứa secret. Base URL không bắt buộc: link admin phải lấy `window.location.origin`/request origin để luôn dùng deployment hiện tại.
5. Tạo module schema/type dùng chung bằng Zod cho locale `vi|en`, search params `k` và `l`, guest CRUD, RSVP, login và response DTO. Tạo generator NanoID/Base62 8 ký tự, retry khi unique collision; tên khách không nằm trong URL. Chuẩn canonical là `/?k=<8-char-code>&l=<vi|en>`; chấp nhận thiếu `l` và mặc định `vi`, nhưng không hỗ trợ cú pháp hai dấu `?` cũ.

### Phase 2: Supabase và API bảo mật

6. Tạo Supabase browser/server helpers riêng. Dùng `@supabase/ssr` cho đăng nhập email/password và session cookie `HttpOnly`, `Secure` ở production, `SameSite=Lax`; thêm helper kiểm tra session và membership trong `admin_users`. Mọi endpoint admin phải xác minh lại user ở server, không chỉ dựa vào route guard phía client.
7. Tạo API public theo pattern `server.handlers` đang có ở `src/routes/mcp.ts`: GET invitation theo mã `k` chỉ trả tên khách, giới hạn số người và RSVP hiện có; POST/PUT RSVP nhận mã mời, validate Zod, tra guest hợp lệ rồi upsert đúng một bản ghi theo `guest_id`. Không nhận `guest_id` tin cậy từ client, không trả dữ liệu khách khác, thêm response 404/422/429/500 có mã lỗi ổn định và rate-limit cơ bản cho lookup/submit.
8. Tạo API auth login/logout/session và các endpoint admin cho guest CRUD, danh sách RSVP kết hợp guest, thống kê, và export CSV. Guest create sinh mã mời ngắn; update không đổi mã mặc định; regenerate mã phải là thao tác riêng có confirm vì làm link cũ vô hiệu. CSV dùng `papaparse` để escape đúng Unicode/dấu phẩy/công thức, trả UTF-8 BOM và tên file rõ ràng. Stats gồm tổng khách mời, đã phản hồi, tham dự, từ chối, chưa phản hồi và tổng số người tham dự.
9. Thêm TanStack Query hooks/query keys cho public lookup/upsert và admin list/stats/mutations. Invalidate guest, RSVP và stats sau mutation; login/logout xóa cache nhạy cảm. Tránh fetch waterfall bằng cách tải danh sách và stats song song sau khi session được xác nhận.

### Phase 3: Song ngữ và nội dung sự kiện

10. Đổi Paraglide từ `en/de` sang `vi/en`, đặt `vi` làm base locale, thay `messages/de.json` bằng `messages/vi.json` và mở rộng hai message catalog với cùng key cho toàn bộ thiệp, form, lỗi, trạng thái và admin. Chạy generator thay vì sửa output `src/paraglide/*`.
11. Tạo một cấu hình sự kiện tập trung cho ISO datetime có timezone `Asia/Ho_Chi_Minh`, địa điểm, URL bản đồ, timeline và giới hạn mặc định. Nội dung mẫu phải mang ngữ cảnh seminar nguyên liệu/công thức mỹ phẩm cho công ty bán hóa chất, không dùng copy đám cưới hoặc nội dung lorem ipsum; cấu trúc cho phép thay tên seminar, logo, ảnh và thông tin thật sau này mà không sửa component.
12. Ở route `/`, validate search params bằng TanStack Router, đồng bộ Paraglide từ `l`, giữ nguyên `k` khi đổi ngôn ngữ và cập nhật `document.lang`. Trạng thái thiếu/sai/hết hạn mã mời có màn hình song ngữ riêng, không render form RSVP. Cập nhật title, description và metadata gốc theo seminar.

### Phase 4: Thiệp mobile 425px

13. Thay starter ở `src/routes/index.tsx` bằng invitation shell rộng `100%`, `max-width: 425px`, căn giữa trên màn hình lớn; chiều cao section dùng responsive min-height thay vì khóa cứng. Mặt thiệp là trải nghiệm dọc liên tục, không chia mọi section thành card; phần nền desktop bên ngoài thiệp trung tính. Giữ touch target tối thiểu 44px, safe-area inset, focus visible và không overflow ngang ở 320–425px.
14. Xây năm section theo đúng thứ tự: hero cá nhân hóa “Kính mời {fullName}” và tên seminar; thời gian/địa điểm có nút mở bản đồ và countdown ngày/giờ/phút/giây; timeline theo trình tự thực; RSVP; outro cảm ơn. Countdown dùng event datetime cố định, cập nhật mỗi giây nhưng không gây hydration mismatch, và chuyển sang trạng thái “sự kiện đã bắt đầu” khi hết hạn.
15. Thiết kế visual theo ngôn ngữ phòng lab mỹ phẩm cao cấp: nền sáng sạch, màu carbon/teal khoáng/champagne và một accent coral có kiểm soát; typography editorial nhưng dễ đọc tiếng Việt; chi tiết đường nối phân tử và bề mặt trong suốt chỉ dùng để truyền tải chủ đề. Tránh palette một màu, beige template, gradient tím, card lồng card, nhãn all-caps trang trí và heading quá lớn trong mobile.
16. Tạo `MoleculeScene` bằng `three` + React Three Fiber/Drei: cụm phân tử/liquid-glass procedural, full-bleed/unframed trong hero, phản ứng nhẹ với pointer/gyro-safe input và không cần model ngoài. Lazy-load canvas phía client để giảm bundle ban đầu; giới hạn DPR khoảng 1–1.5, tạm dừng khi ngoài viewport/tab ẩn, có fallback bitmap/CSS khi WebGL lỗi và render tĩnh khi `prefers-reduced-motion`.
17. Dùng `motion/react` cho một chuỗi mở thiệp có chủ đích, reveal timeline khi vào viewport và feedback khi gửi RSVP; không gắn fade-up giống nhau cho mọi section. Tất cả animation phải tắt/rút gọn theo reduced motion và không làm layout shift.
18. Xây RSVP bằng TanStack Form + Zod và shadcn Field: tên đã điền từ invitation nhưng cho phép chỉnh, textarea lời nhắn, RadioGroup tham dự/không tham dự, Select 1–5 chỉ hiện/kích hoạt khi tham dự. Khi từ chối gửi `attendee_count=0`; khi mở lại link, hydrate phản hồi cũ để sửa. Có pending, validation, retry, success confirmation và lỗi mạng rõ ràng; chống double submit.

### Phase 5: Admin responsive

19. Tạo `/admin/login` và `/admin` với route guard dựa trên session server. Login gồm email/password, lỗi xác thực rõ ràng và redirect về dashboard; logout xóa cookie và query cache. Admin responsive nhưng không bị giới hạn 425px như thiệp.
20. Dashboard có header gọn, locale switcher, các chỉ số thống kê, tìm kiếm/lọc theo RSVP, bảng desktop và danh sách mobile cho khách mời. Hiển thị tên, mã/link, trạng thái, số người, lời nhắn và cập nhật gần nhất; dùng badge trạng thái và skeleton/empty/error states từ shadcn.
21. Thêm dialog tạo/sửa/xóa khách, nút copy link và regenerate mã có AlertDialog xác nhận. Link được tạo bằng `new URL('/', current origin)` với `k` và ngôn ngữ đã chọn; hỗ trợ copy từng link và export CSV. Không đưa chỉnh sửa nội dung seminar vào admin v1 theo quyết định phạm vi.

### Phase 6: Hoàn thiện và triển khai

22. Cập nhật root shell để font/metadata phù hợp, chỉ bật TanStack devtools ở development, và bổ sung toast provider. Tách 3D/admin thành dynamic chunks; không import Three.js vào bundle admin hoặc route lỗi.
23. Viết README triển khai Supabase/Vercel: tạo project, chạy migration, tạo admin Auth user + `admin_users`, cấu hình env cho local/preview/production, deploy, và smoke-test URL thật. Ghi rõ link mẫu hợp lệ `https://tuongngocyep.vercel.app/?k=Ab3x9Q2m&l=vi`.

**Relevant files**

- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\package.json` — dependencies, scripts test/typecheck và package manager.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\components.json` — nguồn cấu hình shadcn; dùng CLI, không tự đoán API component.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\env.ts` — Supabase env validation và ranh giới secret.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\routes\__root.tsx` — metadata, locale/html lang, providers, devtools production guard.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\routes\index.tsx` — route invitation, search validation và composition năm section.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\routes\mcp.ts` — mẫu `server.handlers` gần nhất để tạo API routes mới.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\routes\admin\login.tsx` — login admin mới.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\routes\admin\index.tsx` — dashboard admin mới.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\routes\api\invitations.$code.ts` — public invitation lookup mới; xác nhận tên file dynamic route với router generator của phiên bản đang cài.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\routes\api\rsvp.ts` — RSVP lookup/upsert mới.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\routes\api\admin\*.ts` — auth, guest CRUD, stats và CSV mới.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\components\invitation\*` — section, countdown, RSVP và 3D scene mới.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\components\admin\*` — dashboard, table/list, filters và dialogs mới.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\lib\supabase\*` — browser/server clients, SSR cookie adapter và admin authorization.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\lib\schemas.ts` — DTO/Zod schemas dùng chung.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\content\event.ts` — dữ liệu cấu trúc seminar mẫu.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\src\styles.css` — token màu/type/layout và reduced-motion/WebGL fallback.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\project.inlang\settings.json` — locales `vi/en`, base `vi`.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\messages\vi.json` và `d:\SELF_PROJECT\SEMINAR_CARD\seminar\messages\en.json` — toàn bộ copy song ngữ.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\supabase\migrations\001_initial_schema.sql` — schema, constraints, indexes và RLS.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\.env.example` — tên biến môi trường không chứa secret.
- `d:\SELF_PROJECT\SEMINAR_CARD\seminar\README.md` — setup Supabase, admin, Vercel và link format.

**Verification**

1. Chạy `pnpm generate-routes`, `pnpm check`, `pnpm exec tsc --noEmit` và `pnpm build`; xác nhận không sửa tay generated route/i18n output và service-role key không xuất hiện trong client bundle.
2. Unit test schema, token generator/collision retry, countdown trước/sau event, link builder với Unicode guest name trong DB, locale fallback, RSVP attendance/count constraints và CSV escaping.
3. API integration test các nhánh: mã hợp lệ/sai/hết hạn, RSVP tạo/cập nhật/từ chối, giới hạn 1–5, unauthenticated admin 401, non-admin 403, CRUD/link regeneration và thống kê sau mutation.
4. Playwright kiểm tra luồng đầy đủ ở viewport 320x568, 375x812 và 425x900: mở link vi/en, đổi ngôn ngữ vẫn giữ `k`, submit rồi sửa RSVP, countdown, map, invalid token, login admin, tạo khách, copy link, lọc và export.
5. Chụp screenshot thiệp ở 375px và 425px cùng admin mobile/desktop; xác nhận không overlap/overflow, chữ tiếng Việt không vỡ, touch target/focus đúng và section kế tiếp còn có tín hiệu hợp lý khi cuộn.
6. Kiểm tra canvas bằng screenshot và pixel assertion: không blank, đúng framing, chuyển động/interactivity hoạt động; test WebGL fallback, tab hidden, reduced motion và thiết bị DPR cao. Đánh giá Lighthouse mobile, ưu tiên LCP/CLS và đảm bảo chunk Three.js lazy-load.
7. Trên Vercel preview, kiểm tra callback/cookie Supabase, env, refresh session, logout, deep-link `/admin`, URL sinh từ preview origin; lặp lại smoke test trên production domain.

**Decisions**

- Supabase là persistence và Supabase Auth email/password bảo vệ admin.
- V1 chỉ có một seminar; nội dung sự kiện song ngữ nằm trong source config/messages, không chỉnh từ admin.
- Admin v1 quản lý khách/link, RSVP, thống kê và CSV; không có CMS, gửi email/SMS/WhatsApp hàng loạt hoặc nhiều sự kiện.
- Khách được sửa RSVP khi mở lại cùng mã mời; mã mời là bearer capability nên phải đủ entropy, không chứa tên, và endpoint phải rate-limit.
- Mỗi khách tối đa 5 người; schema vẫn lưu `max_attendees` để có thể tùy chỉnh sau nhưng UI v1 mặc định 5.
- Thiệp là mobile-first, rộng tối đa 425px; admin là responsive desktop/mobile và không chịu giới hạn này.
- Điểm nhấn 3D là phân tử mỹ phẩm procedural, không phụ thuộc model ngoài; nội dung/ảnh/logo hiện dùng placeholder có cấu trúc để thay sau.
- URL canonical dùng hai query params `k` và `l`, nối bằng `&`; không dùng `?k=ngoc?en=vi` vì cú pháp đó không hợp lệ.

**Claude handoff**

- Claude triển khai tuần tự Phase 1 → 6; sau mỗi phase chạy kiểm tra hẹp tương ứng trước khi mở rộng.
- Trước khi dùng shadcn, TanStack Start cookie/server handler hoặc Paraglide locale API, Claude phải đọc docs đúng phiên bản đang cài và dùng pattern của repo; không sao chép API giả định từ plan nếu signature đã thay đổi.
- Không sửa hoặc xóa phần MCP hiện có trừ khi có xung đột build trực tiếp; không commit secret, generated cache hoặc dữ liệu production.
