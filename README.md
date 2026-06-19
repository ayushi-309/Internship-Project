# NayePankh Foundation — Volunteer Registration System

A full-stack volunteer management application built for NayePankh Foundation with database persistence, authentication, role-based administration, event registration, hour approval, and downloadable reports.

## Features

- Volunteer account registration and JWT login
- SQLite database with seeded demo data
- Volunteer profile, skills, and availability management
- Event discovery, search, skill filtering, registration, and cancellation
- Volunteer hour submission with admin approval or rejection
- Admin dashboard with operational charts and summary metrics
- Admin event management and volunteer activation/deactivation
- CSV reports for volunteers and events
- Responsive React interface served by Vite in development and Express in production

## Technology

- Frontend: React, React Router, Vite, Lucide icons
- Backend: Node.js, Express
- Database: SQLite
- Authentication: JWT and bcrypt password hashing

## Run locally

Open two terminals.

### Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

The API runs at `http://localhost:5000`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@volunteer.org` | `AdminPassword123` |
| Volunteer | `john@example.com` | `Password123` |

New users can also create volunteer accounts from the login page.

## Reports

Sign in as the administrator and open **Admin Dashboard**. The dashboard provides:

- active volunteer, upcoming event, approved-hour, and pending-approval totals;
- participation, skills, and registration charts;
- downloadable volunteer and event CSV reports.

## Production build

```powershell
cd frontend
npm run build
cd ..\backend
npm start
```

Express automatically serves `frontend/dist` when that directory exists.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/events` plus admin event create/update/delete routes
- volunteer registration, cancellation, history, and hour logging routes
- admin volunteer roster, hour approval, dashboard summary, and CSV export routes
- `GET /api/health` for a basic service health check

## About NayePankh Foundation

NayePankh Foundation is a non-profit organization dedicated to community development, education, and volunteer-driven social impact. This portal helps coordinate and manage volunteer activities across all NayePankh Foundation programs.
