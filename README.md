# Thiệp mời Seminar (Cosmetic Ingredients Seminar Invitation)

Thiệp mời seminar song ngữ Việt/Anh (TanStack Start), mobile-first (≤425px), với điểm nhấn phân tử 3D (Three.js/React Three Fiber) và RSVP lưu trên Supabase. Bao gồm trang quản trị khách mời tại `/admin`.

## 1. Cài đặt cục bộ

```bash
pnpm install
pnpm dev
```

App chạy tại `http://localhost:3000`. Không có Supabase env, các API sẽ lỗi 500 — làm theo phần 2 trước khi test RSVP/admin.

## 2. Tạo project Supabase

1. Tạo project mới tại [supabase.com](https://supabase.com/dashboard).
2. Vào **SQL Editor**, chạy nội dung file [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql). Migration này tạo 3 bảng (`admin_users`, `guests`, `rsvps`), bật RLS (không có policy công khai — mọi truy cập đi qua server bằng service-role key) và các index/trigger cần thiết.
3. Lấy 3 giá trị trong **Project Settings → API**:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**bí mật, không public, không đưa vào client bundle**)

## 3. Tạo tài khoản admin đầu tiên

1. Vào **Authentication → Users → Add user**, tạo user bằng email/password.
2. Copy `User UID` của user vừa tạo.
3. Chạy trong SQL Editor:
   ```sql
   insert into public.admin_users (user_id) values ('<user-uid-vừa-copy>');
   ```
4. Đăng nhập tại `/admin/login` bằng email/password đó.

Muốn thêm admin khác: lặp lại 3 bước trên với user mới.

## 4. Cấu hình biến môi trường

Copy `.env.example` thành `.env` (local) và điền:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`SERVER_URL` để trống — link mời do admin tạo luôn dùng origin của request hiện tại (`window.location.origin` phía client, request origin phía server), nên tự hoạt động ở localhost, Vercel preview lẫn production mà không cần cấu hình thêm.

### Trên Vercel

Vào **Project Settings → Environment Variables**, thêm 3 biến trên cho cả 3 môi trường (Production/Preview/Development). `VITE_*` là biến public (an toàn lộ ra client), `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server — Vercel không expose nó ra client bundle vì không có prefix `VITE_`.

## 5. Deploy lên Vercel

```bash
vercel deploy         # preview
vercel deploy --prod  # production
```

Hoặc kết nối repo Git với Vercel để auto-deploy mỗi push. Không cần cấu hình build command đặc biệt — Vercel tự nhận `vite build`.

## 6. Smoke test sau khi deploy

1. Tạo một khách mời thử trong `/admin` (đăng nhập trước), copy link được sinh ra — ví dụ dạng thật trên production:
   ```
   https://tuongngocyep.vercel.app/?k=Ab3x9Q2m&l=vi
   ```
2. Mở link ẩn danh (trình duyệt riêng tư), xác nhận: tên hiển thị đúng, đổi ngôn ngữ vẫn giữ `k`, gửi RSVP thành công, mở lại link thấy phản hồi cũ.
3. Mở link với mã sai (`?k=xxxxxxxx`) → phải thấy màn hình "không tìm thấy lời mời", không phải form RSVP.
4. Đăng xuất/đăng nhập lại `/admin`, refresh trang `/admin` trực tiếp (deep-link) để xác nhận session cookie qua Supabase hoạt động đúng trên domain thật.
5. Thử xuất CSV, sao chép link, tạo lại mã mời (regenerate) — xác nhận link cũ báo "không tìm thấy" sau khi regenerate.

## Định dạng URL mời

Canonical: `<origin>/?k=<mã 8 ký tự Base62>&l=<vi|en>`. Thiếu `l` mặc định `vi`. Tên khách **không** nằm trong URL — chỉ có mã mời, tên đầy đủ nằm trong database và được server trả về sau khi tra mã.

## Giới hạn đã biết (v1)

- **Locale SSR**: server luôn render tiếng Việt (base locale) trước; client tự sửa theo `l` ngay sau khi hydrate (không reload). Độ trễ không đáng kể trên thực tế.
- **Rate limit**: in-memory theo từng instance server (đủ cho quy mô một seminar), không đồng bộ giữa nhiều instance chạy song song.
- Không có CMS/gửi email hàng loạt/nhiều sự kiện trong admin v1 — xem `docs/implementation-plan.md` mục **Decisions**.

## Development

```bash
pnpm dev             # dev server (port 3000)
pnpm build           # production build
pnpm generate-routes # regenerate src/routeTree.gen.ts sau khi thêm/sửa route
pnpm check           # biome lint + format check
pnpm format          # biome format --write
```

- **shadcn/ui**: `pnpm dlx shadcn@latest add <component>` — không tự viết API component, luôn dùng CLI.
- **Paraglide i18n**: sửa `messages/vi.json` / `messages/en.json`, sau đó chạy `pnpm dev`/`pnpm build` (hoặc `pnpm exec paraglide-js compile --project ./project.inlang --outdir ./src/paraglide`) để regenerate `src/paraglide/*`. Không sửa tay các file trong `src/paraglide/`.
- **Route files**: thêm/sửa file trong `src/routes/`, sau đó chạy `pnpm generate-routes`. Không sửa tay `src/routeTree.gen.ts`.
- Chi tiết kế hoạch triển khai và nhật ký thay đổi: xem [`docs/implementation-plan.md`](docs/implementation-plan.md) và [`docs/process.md`](docs/process.md).
