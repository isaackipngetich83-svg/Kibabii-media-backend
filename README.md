# Kibucu API

Node.js + Express backend for Kibucu Media Ministry.
Uses **SQLite** (single file, zero external server needed) via `better-sqlite3`.

---

## Requirements

- Node.js 18 or higher
- npm

---

## Setup (run once)

```bash
cd kibucu-api
npm install
npm run seed       # creates kibucu.db and fills it with initial data
npm run dev        # starts the server with auto-reload
```

The server runs on **http://localhost:4000**.

Verify it's working:
```
curl http://localhost:4000/api/health
```

---

## Running alongside the frontend

Open two terminals:

**Terminal 1 — backend:**
```bash
cd kibucu-api
npm run dev
```

**Terminal 2 — frontend:**
```bash
cd kibucu-media
npm run dev
```

Frontend runs on http://localhost:5173, backend on http://localhost:4000.

---

## Demo accounts

| Reg No          | Password   | Role   |
|-----------------|------------|--------|
| COM/0110/24     | kibucu123  | Member |
| STAFF/0009/19   | kibucu123  | Admin  |

---

## API overview

| Method | Path                          | Who        | What                         |
|--------|-------------------------------|------------|------------------------------|
| POST   | /api/auth/login               | Public     | Sign in, returns JWT token   |
| POST   | /api/auth/signup              | Public     | Register new account         |
| GET    | /api/members                  | Auth       | List members                 |
| DELETE | /api/members/:id              | Admin      | Remove a member              |
| GET    | /api/services                 | Auth       | All services                 |
| GET    | /api/availability             | Auth       | Availability records         |
| POST   | /api/availability             | Member     | Submit availability + roles  |
| GET    | /api/attendance               | Auth       | Attendance records           |
| POST   | /api/attendance               | Member     | Mark self present (today only)|
| DELETE | /api/attendance/:serviceId    | Member     | Unmark (today only)          |
| PUT    | /api/attendance/admin         | Admin      | Correct any attendance record|
| GET    | /api/lineups                  | Auth       | All lineups                  |
| PUT    | /api/lineups/assign           | Admin      | Assign a role                |
| PUT    | /api/lineups/publish          | Admin      | Publish / unpublish          |
| GET    | /api/inbox                    | Auth       | Unified feed for current user|
| PUT    | /api/inbox/:id/read           | Auth       | Mark item read               |
| PUT    | /api/inbox/read-all/all       | Auth       | Mark all read                |
| POST   | /api/inbox                    | Admin      | Post announcement / event    |
| DELETE | /api/inbox/:id                | Admin      | Remove a post                |
| GET    | /api/roles                    | Auth       | Ministry role list           |
| POST   | /api/roles                    | Admin      | Add a role                   |
| DELETE | /api/roles/:name              | Admin      | Remove a role                |
| GET    | /api/slots?serviceId=s1       | Admin      | Slot requests for a service  |
| PUT    | /api/slots/:id/review         | Admin      | Mark a request reviewed      |

---

## Database file

SQLite database is saved as `kibucu.db` in this folder.
It is excluded from git (see `.gitignore`).

To reset the database and start fresh:
```bash
rm kibucu.db
npm run seed
```

---

## Environment variable

Copy `.env.example` to `.env` and set a strong secret before deploying:

```
JWT_SECRET=your-long-random-secret-here
PORT=4000
```
