# Process Log — Thiệp seminar mỹ phẩm và admin

Theo dõi tiến độ triển khai theo `docs/implementation-plan.md`. Cập nhật sau mỗi bước hoàn thành.

Trạng thái: 🚧 đang chạy | ✅ xong | ⏭️ bỏ qua/hoãn

## Phase 1: Nền tảng và hợp đồng dữ liệu
- [x] 1. Lưu handoff plan (đã có sẵn `docs/implementation-plan.md`)
- [x] 2. Cài dependencies (`motion`, `three`, `@react-three/fiber`, `@react-three/drei`, `@supabase/supabase-js`, `@supabase/ssr`, `nanoid`, `papaparse`, `vitest`, `@testing-library/*`, `jsdom`, `@playwright/test`) + shadcn (`button input textarea field radio-group select table badge dialog alert-dialog dropdown-menu skeleton separator tooltip sonner` — kéo theo `label`)
- [x] 3. `supabase/migrations/001_initial_schema.sql`: `admin_users`, `guests`, `rsvps`, constraints, indexes, RLS bật (không policy công khai), trigger `updated_at`
- [x] 4. `src/env.ts` thêm `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; `.env.example` không chứa secret
- [x] 5. `src/lib/schemas.ts` (Zod: locale, search params, guest CRUD, RSVP, login, DTOs, mã lỗi ổn định), `src/lib/invite-code.ts` (Base62 8 ký tự + retry collision), `src/lib/invite-link.ts` (link builder theo origin hiện tại)

## Phase 2: Supabase và API bảo mật
- [x] 6. `src/lib/supabase/server.ts` (cookie get/set qua `@supabase/ssr` + gói `cookie`, HttpOnly/Secure theo protocol/SameSite=Lax), `admin.ts` (service-role, server-only); `src/lib/auth.ts` `requireAdminUser()` xác thực lại session + `admin_users` bằng service-role ở mọi request admin. (`browser.ts` ban đầu có tạo nhưng không nơi nào gọi trực tiếp Supabase từ client — mọi thao tác auth đi qua API route server-side — nên đã xóa để tránh code chết.)
- [x] 7. `src/routes/api/invitations.$code.ts` (GET, rate-limit 30/phút/IP), `src/routes/api/rsvp.ts` (POST/PUT upsert theo `guest_id` tra từ `invite_code`, rate-limit 10/phút/IP, check `attendeeCount <= max_attendees`)
- [x] 8. `src/routes/api/admin/{login,logout,session}.ts`, `guests.ts` (GET list + POST create sinh mã), `guests.$id.ts` (PATCH/DELETE), `guests.$id.regenerate.ts` (POST, thao tác riêng), `stats.ts`, `export.ts` (CSV UTF-8 BOM qua papaparse)
- [x] 9. `src/lib/query-keys.ts`, `src/lib/api-client.ts` (fetch wrapper parse lỗi chuẩn), hooks `use-invitation.ts`, `use-admin-auth.ts`, `use-admin-guests.ts` (list+stats tải song song, invalidate sau mutation)

Lưu ý: rate limit hiện là in-memory theo instance (đủ dùng cho scale seminar 1 sự kiện); nếu deploy nhiều instance/khu vực đồng thời sẽ không đồng bộ đếm — ghi chú trong README.

## Phase 3: Song ngữ và nội dung sự kiện
- [x] 10. `project.inlang/settings.json` baseLocale `vi`, locales `["vi","en"]`; `messages/vi.json` thay `de.json`, `messages/en.json` mở rộng full key (~90 keys: site, invite status, hero, schedule, countdown, timeline, rsvp, outro, admin); `vite.config.ts` đổi `strategy: ['cookie','baseLocale']` (bỏ `'url'` vì locale nằm ở query `l`, không phải path prefix); chạy `paraglide-js compile` để regenerate `src/paraglide/*`
- [x] 11. `src/content/event.ts`: tên seminar/organizer/venue/timeline song ngữ, `startsAt` ISO `+07:00`, nội dung mẫu ngữ cảnh nguyên liệu/công thức mỹ phẩm (không lorem ipsum)
- [x] 12. `src/lib/locale.ts` (`useLocaleSync`: đồng bộ cookie paraglide từ `l`, tránh hydration mismatch bằng cờ `hydrated` — xem "Known limitations" bên dưới); `src/routes/index.tsx` dùng `validateSearch: invitationSearchSchema`, render `InvitationStatusScreen` khi thiếu `k`/404/lỗi, `head()` set title/description

## Phase 4: Thiệp mobile 425px
- [x] 13. `InvitationShell.tsx`: max-width 425px căn giữa, `.lab-theme` scoped theme, `LanguageToggle` nổi góc trên phải, safe-area qua `.lab-safe-top/bottom`
- [x] 14. 5 section theo đúng thứ tự: `HeroSection`, `ScheduleSection` (+ `Countdown`), `TimelineSection`, `RsvpSection`, `OutroSection`; countdown tick mỗi giây, tránh hydration mismatch bằng `useState(null)` ban đầu, chuyển "đã bắt đầu" khi hết hạn
- [x] 15. Viết lại `src/styles.css`: bỏ theme "island" demo cũ (sea-ink/lagoon/palm), thêm token `.lab-theme` (carbon/mineral-teal/champagne/coral), nền ngoài thiệp trung tính `#eef0ee`
- [x] 16. `MoleculeCanvas.tsx` (R3F, cụm 6 "nguyên tử" + bond hình trụ, `meshPhysicalMaterial` transmission cho hiệu ứng liquid-glass, xoay nhẹ + parallax theo pointer, không dùng model ngoài); `MoleculeScene.tsx` (lazy-load client-only, WebGL feature-detect, `IntersectionObserver` + `visibilitychange` để pause, `prefers-reduced-motion` → frameloop `demand`, error boundary → fallback CSS gradient tĩnh, `dpr=[1,1.5]`)
- [x] 17. `motion/react` cho hero reveal + `whileInView` reveal ở Schedule/Timeline/RSVP/Outro; `.lab-theme` có block CSS tắt animation khi `prefers-reduced-motion: reduce`
- [x] 18. `RsvpForm.tsx`: TanStack Form + shadcn Field/RadioGroup/Select, tên prefill từ invitation nhưng sửa được, Select 1..maxAttendees chỉ hiện khi tham dự, hydrate RSVP cũ khi mở lại link, pending/validation/success confirmation/lỗi mạng riêng biệt, disable nút khi `isPending` chống double-submit

## Phase 5: Admin responsive
- [x] 19. `src/routes/admin/login.tsx` (form email/password, lỗi rõ ràng, redirect `/admin` khi thành công hoặc đã có session), `src/routes/admin/index.tsx` (`beforeLoad` gọi server function `checkAdminSession` — xác thực lại cookie phía server qua `requireAdminUser`, redirect `/admin/login` nếu chưa đăng nhập); logout xóa cookie + `queryClient.clear()`
- [x] 20. `AdminHeader` (locale switcher, logout), `StatsGrid` (6 chỉ số + skeleton), `GuestDataView` (search + filter trạng thái, `Table` desktop / card list mobile, `Badge` trạng thái, empty state)
- [x] 21. `GuestFormDialog` (create/edit), `ConfirmDialog` dùng chung cho xóa/regenerate (AlertDialog), copy link qua `navigator.clipboard` + toast sonner, export CSV là link trực tiếp tới `/api/admin/export`; không có UI chỉnh nội dung seminar (đúng quyết định phạm vi v1)

### Known limitations (ghi nhận có chủ đích)
- **Locale SSR**: server luôn render `vi` (base locale) vì Paraglide không tự đọc query string phía server (chỉ hỗ trợ path-prefix qua strategy `url`, không hỗ trợ query param). Client tự sửa locale ngay sau khi hydrate (`useLocaleSync`), không có bước reload — độ trễ nhỏ, không ảnh hưởng SEO vì trang có `noindex` tự nhiên (thiệp riêng tư qua mã mời). Muốn SSR đúng locale theo `l` cần viết custom Paraglide strategy + wire `paraglideMiddleware` vào server entry của TanStack Start — nằm ngoài phạm vi thời gian hiện tại.
- **Rate limit**: in-memory theo instance (đã ghi ở Phase 2).

## Phase 6: Hoàn thiện và triển khai
- [x] 22. `src/routes/__root.tsx`: thêm `<Toaster />` (sonner) toàn cục, TanStack devtools chỉ bật khi `import.meta.env.DEV`; xác nhận qua build rằng `MoleculeCanvas` tách chunk riêng (~898 kB client / ~4 kB server) và bundle admin (~39 kB) không kéo theo Three.js
- [x] 23. Viết lại `README.md`: setup Supabase (migration, service-role key), tạo admin đầu tiên, biến môi trường local/Vercel, deploy, smoke-test checklist, định dạng URL mời, giới hạn v1

## Verification
- [x] `pnpm generate-routes`, `pnpm check`, `pnpm exec tsc --noEmit`, `pnpm build` — tất cả pass (build ra `MoleculeCanvas` là chunk riêng ~898 kB, xác nhận code-split đúng yêu cầu)
- [x] Unit tests (`pnpm test`, Vitest): 26 test / 4 file — Base62 invite-code (format + 2000-sample uniqueness + retry-on-23505 + no-retry-on-other-error), link builder (giữ nguyên origin, không lộ tên khách), Zod schemas (locale fallback `vi`, ràng buộc attending/attendeeCount, giới hạn `maxAttendees`), countdown (`computeRemaining` trước/đúng lúc/sau sự kiện dùng fake timers)
- [x] Smoke test thủ công qua `pnpm dev` + `curl` với Supabase env giả (không có project thật): xác nhận route `/`, `/?k=...&l=..`, `/admin/login`, `/admin` (redirect khi chưa đăng nhập) đều mount đúng, màn hình "thiếu mã mời" hiển thị đúng tiếng Việt, và **phát hiện + sửa 4 chỗ thiếu kiểm tra `error` khi destructure kết quả Supabase** (`invitations.$code.ts`, `rsvp.ts`, `auth.ts`, `admin/login.ts`) — trước đó một lỗi kết nối/DB thật sẽ bị báo nhầm thành "không tìm thấy lời mời" (404) hoặc "sai mật khẩu" thay vì lỗi hệ thống, che giấu sự cố hạ tầng thật. Đã sửa toàn bộ, verify lại bằng curl thấy đúng `INTERNAL_ERROR`.
- [x] Sửa 1 bug thật khác trong lúc verify: `src/env.ts` dùng `import.meta.env.SUPABASE_SERVICE_ROLE_KEY`/`SERVER_URL` — trong dev SSR module runner của Vite, `import.meta.env` chỉ populate biến có prefix `VITE_`, biến server-only bị `undefined` dù `.env` đúng, khiến toàn bộ app 500 ngay từ import. Đã đổi sang đọc `process.env` cho 2 biến server-only này (xác nhận bằng thực nghiệm: sau khi đổi, tất cả route mount được).
- [ ] API integration test tự động (mã hợp lệ/sai/hết hạn, RSVP CRUD, 401/403, CSV) — **chưa viết**; đã verify thủ công qua curl với env giả (xem trên) nhưng cần Supabase project thật + test runner riêng (vd. `vitest` với Supabase test project hoặc mock) để tự động hóa. Để lại cho bước tiếp theo.
- [ ] Playwright mobile flows (320/375/425) — **chưa viết**, cần Supabase project thật với dữ liệu mẫu để test hết luồng (mở link, đổi ngôn ngữ, RSVP, admin CRUD). `@playwright/test` đã cài sẵn trong devDependencies.
- [ ] Screenshot 375/425px + admin, đánh giá Lighthouse — **chưa làm**, cần trình duyệt thật/headless; môi trường hiện tại chỉ verify qua `curl` (SSR HTML) và code review, không render pixel.
- [ ] Canvas/WebGL fallback pixel-test — **chưa làm** cùng lý do trên; đã review logic (feature-detect, error boundary, reduced-motion, visibility pause) nhưng chưa chạy trong trình duyệt thật.
- [ ] Vercel preview/production smoke test — **chưa làm**, cần Supabase project thật + Vercel deployment; checklist đầy đủ đã có trong README mục 6.

## Việc còn lại cho người dùng (không thể tự làm trong phiên này)
1. Tạo Supabase project thật, chạy migration, tạo admin user đầu tiên (README mục 2–3).
2. Điền `.env` thật (đã có `.env.example`) và deploy lên Vercel (README mục 4–5).
3. Chạy smoke test thật theo checklist README mục 6, đặc biệt: RSVP tạo/sửa, countdown, 3D canvas trên thiết bị thật, đăng nhập/đăng xuất admin qua domain thật (cookie behavior).
4. Nếu cần test tự động đầy đủ: viết Playwright suite (đã có `@playwright/test`) và API integration test nhắm vào một Supabase project test riêng.
5. QA thị giác thiệp ở 320/375/425px trên trình duyệt/thiết bị thật, đặc biệt phần 3D molecule và animation.

---

## Nhật ký chi tiết

Xem lịch sử commit/diff của phiên làm việc này để biết chi tiết từng file. Các quyết định kiến trúc đáng chú ý và giới hạn đã biết được ghi trực tiếp trong mục Phase tương ứng ở trên và trong "Known limitations".
