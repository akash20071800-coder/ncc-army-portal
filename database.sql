# NCC Army Wing Portal Backend

## Quick start

1. Install dependencies:
   npm install
2. Copy environment file:
   cp .env.example .env
3. Start the API:
   npm start

## Default login accounts
- Admin: `Admin` / `admin123`
- Senior: `Senior Cadet 1` / `senior123`
- Junior: `Junior Cadet 1` / `junior123`
- ANO: `ANO 1` / `ano123`
- Cadet: `Cadet 01` / `cadet123`

## Features
- JWT authentication
- Role-based access
- Cadets, NR, letters, attendance, finance, volunteer, drive APIs
- Settings management and backup import/export
- PostgreSQL-ready schema with JSON fallback storage
- Docker support for deployment

## Core routes
- GET `/health`
- POST `/api/auth/login`
- POST `/api/auth/register`
- GET `/api/dashboard`
- GET `/api/settings`
- PUT `/api/settings`
- POST `/api/settings/import`
- GET `/api/backup`
- GET `/api/cadets`
- POST `/api/cadets`
- PUT `/api/cadets/:id`
- DELETE `/api/cadets/:id`
- GET `/api/nrs`
- POST `/api/nrs`
- GET `/api/letters`
- POST `/api/letters`
- GET `/api/attendance`
- POST `/api/attendance`
- GET `/api/volunteer`
- POST `/api/volunteer`
- GET `/api/finance`
- POST `/api/finance`
- GET `/api/drive`
- POST `/api/drive`
- GET `/api/activity`
- GET `/api/users`
- DELETE `/api/users/:id`
- POST `/api/admin/reset-demo`

## Deployment notes
- Set `DATABASE_URL` in `.env` for PostgreSQL.
- Set `JWT_SECRET` for authentication security.
- Deploy behind a public host like Render, Railway, or Docker-based hosting.
