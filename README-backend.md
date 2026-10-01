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

## Deployment prep

### Render deployment
1. Push this branch to GitHub.
2. Create a new Web Service on Render.
3. Connect the repository.
4. Use the default Node build command: `npm install`
5. Use start command: `npm start`
6. Add environment variables:
   - `JWT_SECRET`
   - `DATABASE_URL` (optional, for PostgreSQL)
   - `PORT=4000`

### Railway deployment
1. Create a new project in Railway.
2. Import the repository.
3. Add env variables:
   - `JWT_SECRET`
   - `DATABASE_URL`
   - `PORT=4000`
4. Deploy.

### Docker deployment
Run:
```bash
docker build -t ncc-army-portal .
docker run -p 4000:4000 --env-file .env ncc-army-portal
```

## Production notes
- Use PostgreSQL by setting `DATABASE_URL` in `.env`.
- Set `JWT_SECRET` to a secure random string in production.
- Deploy behind a public host for staff and cadets using shared data.
- This backend is ready for the next frontend integration step.
