# ExpenseFlow

Website **Quản lý chi tiêu** theo kiến trúc full-stack bắt buộc:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend API**: Node.js + Express
- **Database**: PostgreSQL
- **Container hóa**: Docker + Docker Compose
- **CI**: GitHub Actions với `install`, `lint`, `test`, `build`

## Chức năng chính

- Authentication: đăng ký, đăng nhập, đăng xuất
- Quản lý danh mục: thêm, xem, sửa, xóa
- Quản lý giao dịch: thêm khoản thu/chi, xem danh sách, sửa, xóa
- Dashboard:
  - tổng thu nhập
  - tổng chi tiêu
  - số dư hiện tại
  - thống kê theo tháng
  - thống kê theo danh mục
  - biểu đồ xu hướng

## Cấu trúc dự án

```text
.
├── backend/                 # Express API + PostgreSQL bootstrap
├── frontend/                # React UI
├── .github/workflows/ci.yml # GitHub Actions
├── docker-compose.yml
├── .env.example
└── docs/
    ├── deploy-demo.md
    └── incidents.md
```

## Chạy local

### 1. Cài dependency

```bash
npm run install:all
```

### 2. Tạo file môi trường

```bash
cp .env.example .env
```

Điền `JWT_SECRET` và kiểm tra `DATABASE_URL`.

### 3. Chạy development

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`

## Chạy bằng Docker

```bash
docker compose up -d --build
```

Sau khi chạy:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001/api/health`
- PostgreSQL: `localhost:5432`

### Kiểm tra container

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

## CI bắt buộc

Workflow `.github/workflows/ci.yml` chạy khi:

- `push` vào `main`, `dev`, `feature/*`
- `pull_request` vào `main`, `dev`, `feature/*`

Pipeline gồm:

- install dependency
- lint
- test
- build

## Branching đề xuất

- `main`
- `dev`
- `feature/auth`
- `feature/dashboard`
- `feature/docker-ci`

## Environment

Biến môi trường mẫu nằm trong `.env.example`.

Không commit `.env`.
Không hardcode:

- API URL
- DB connection
- secret key

## Test & build

```bash
cd backend && npm test && npm run build
cd frontend && npm test && npm run build
```

## Deploy và incident report

- Hướng dẫn demo/deploy: [docs/deploy-demo.md](docs/deploy-demo.md)
- Báo cáo 3 incident bắt buộc: [docs/incidents.md](docs/incidents.md)
