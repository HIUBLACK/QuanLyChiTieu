# Deploy Vercel + Supabase

Mục tiêu:

- `frontend/` deploy thành 1 Vercel Project
- `backend/` deploy thành 1 Vercel Project
- database dùng **Supabase Postgres**

## 1. Tạo Supabase database

Trong Supabase Dashboard:

1. Tạo project mới
2. Vào `Connect`
3. Lấy **Transaction pooler** connection string

Lý do:

- Theo Supabase, transaction mode phù hợp cho **serverless or edge functions**. Vercel backend của bạn là serverless function. Source: [Supabase connection docs](https://supabase.com/docs/guides/database/connecting-to-postgres)

Ví dụ dạng URL:

```env
DATABASE_URL=postgres://postgres.xxxxx:[PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres
```

## 2. Deploy backend lên Vercel

Theo Vercel, Express app có thể deploy như một **single Vercel Function** và app cần được export hoặc dùng listener. Source: [Vercel Express docs](https://vercel.com/docs/frameworks/backend/express)

Repo này đã có:

- [backend/api/index.js](<d:/Nam4_HK2/Chuyen de cn moi/Code/QuanLyChiTieu/backend/api/index.js>)
- [backend/vercel.json](<d:/Nam4_HK2/Chuyen de cn moi/Code/QuanLyChiTieu/backend/vercel.json>)

### Tạo project backend

1. Import repo vào Vercel
2. Chọn **Root Directory** là `backend`
3. Framework để `Other`
4. Add Environment Variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=<Supabase transaction pooler URL>`
   - `JWT_SECRET=<secret mạnh>`
   - `JWT_EXPIRES_IN_DAYS=7`
   - `FRONTEND_URL=https://<frontend-project>.vercel.app`
5. Deploy

### Test backend

- `https://<backend-project>.vercel.app/`
- `https://<backend-project>.vercel.app/api/health`

## 3. Deploy frontend lên Vercel

Repo này đã có:

- [frontend/vercel.json](<d:/Nam4_HK2/Chuyen de cn moi/Code/QuanLyChiTieu/frontend/vercel.json>)

### Tạo project frontend

1. Import cùng repo vào Vercel lần thứ 2
2. Chọn **Root Directory** là `frontend`
3. Framework preset: `Vite`
4. Add Environment Variable:
   - `VITE_API_BASE_URL=https://<backend-project>.vercel.app`
5. Deploy

## 4. Kết nối frontend và backend trong monorepo

Theo Vercel monorepo docs, bạn có thể tạo **2 projects trong cùng 1 repo**, và có thể dùng **Related Projects** để tránh hardcode URL cho preview environments. Source: [Vercel monorepo docs](https://vercel.com/docs/monorepos)

Hiện tại cách đơn giản nhất để demo là:

- frontend production env trỏ thẳng vào backend production URL
- preview env có thể set thủ công sau nếu cần

## 5. Environment gợi ý

### Backend trên Vercel

```env
NODE_ENV=production
DATABASE_URL=postgres://postgres.xxxxx:[PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN_DAYS=7
FRONTEND_URL=https://your-frontend-project.vercel.app
```

### Frontend trên Vercel

```env
VITE_API_BASE_URL=https://your-backend-project.vercel.app
```

## 6. Lưu ý quan trọng

- Không dùng `localhost` trong env production
- Không commit `.env`
- Nếu đổi domain frontend thì phải update `FRONTEND_URL` ở backend
- Nếu backend báo lỗi kết nối Supabase, kiểm tra lại:
  - đúng **transaction pooler**
  - đúng password
  - đúng port `6543`

## 7. Checklist deploy

- Backend Vercel mở được `/api/health`
- Frontend Vercel load được trang
- Đăng ký / đăng nhập chạy được
- CRUD danh mục chạy được
- CRUD giao dịch chạy được
- Dashboard trả số liệu
