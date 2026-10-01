# NCC Army Wing Portal Backend

## Quick start

1. Install dependencies
   npm install
2. Copy env file
   cp .env.example .env
3. Run the API
   npm start

## Features
- JWT authentication
- Role-based access control
- Cadets, NR, letters, attendance, finance, volunteer, drive APIs
- Settings management and backup import/export
- File-based storage with fallback support for PostgreSQL

## Default login examples
- Admin: `Admin` / `admin123`
- Senior: `Senior Cadet 1` / `senior123`
- Junior: `Junior Cadet 1` / `junior123`
- ANO: `ANO 1` / `ano123`
- Cadet: `Cadet 01` / `cadet123`

## Production notes
- Use PostgreSQL by setting `DATABASE_URL` in `.env`
- Add `JWT_SECRET` for secure token generation
- Run behind a reverse proxy or hosting platform for public deployment

## Core routes
- GET `/health`
- POST `/api/auth/login`
- POST `/api/auth/register`
- GET `/api/dashboard`
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
- GET `/api/settings`
- PUT `/api/settings`
- GET `/api/backup`
