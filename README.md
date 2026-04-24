# TanTienApp

Ứng dụng `React + Vite + Tailwind` đi kèm một server `Express` để proxy sang ERPNext/Frappe. Repo hỗ trợ hai chế độ dữ liệu:

- `mock`: dùng dữ liệu giả để phát triển giao diện nhanh.
- `erpnext`: đăng nhập và thao tác trực tiếp với ERPNext qua proxy `/api`.

## Yêu Cầu

- Node.js 20+.

## Cấu Hình Môi Trường

Tạo file `.env.local` hoặc `.env`:

```env
PORT=3000
ERP_BASE_URL=https://erp.mte.vn
VITE_DATA_SOURCE=mock
```

Để dùng ERPNext thật, đổi:

```env
VITE_DATA_SOURCE=erpnext
```

## Chạy Local

```bash
npm install
npm run dev
```

App chạy tại `http://localhost:3000`.

## Kiểm Tra

```bash
npm run lint
npm run build
```

## Luồng Chính

- Frontend gọi `/api/method/login`, `/api/method/logout`, `/api/method/frappe.auth.get_logged_user`.
- Todo dùng REST endpoint `/api/resource/ToDo`.
- Server proxy rewrite cookie và hỗ trợ lấy CSRF token qua `/api/csrf_token`.
