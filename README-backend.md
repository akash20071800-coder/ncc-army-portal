# NCC Army Wing Portal Backend

## Quick start

1. Install dependencies:
   npm install
2. Copy environment example:
   cp .env.example .env
3. Start the server:
   npm start

## Default login examples
- Admin: `Admin` / `admin123`
- Senior: `Senior Cadet 1` / `senior123`
- Junior: `Junior Cadet 1` / `junior123`
- ANO: `ANO 1` / `ano123`
- Cadet: `Cadet 01` / `cadet123`

## API overview
- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/dashboard`
- `GET /api/cadets`
- `POST /api/cadets`
- `PUT /api/cadets/:id`
- `DELETE /api/cadets/:id`
- `GET /api/nrs`
- `POST /api/nrs`
- `GET /api/letters`
- `POST /api/letters`
- `GET /api/attendance`
- `POST /api/attendance`
- `GET /api/volunteer`
- `POST /api/volunteer`
- `GET /api/finance`
- `POST /api/finance`
- `GET /api/drive`
- `POST /api/drive`

## Notes
- The backend uses a local JSON file store for development.
- If `DATABASE_URL` is set, the project is ready to be connected to PostgreSQL.
- This is a production-ready API scaffold for the NCC unit portal workflow.
