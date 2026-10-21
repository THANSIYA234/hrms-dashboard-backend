# HRMS Backend

Express 5 + Mongoose 9 API for the HRMS Dashboard. Handles authentication, employee / department CRUD, attendance, leave workflow, and notifications.

## Features

- JWT access + refresh tokens with rotation
- Role-based authorization (`admin`, `employee`)
- Attendance: punch-in / punch-out, daily snapshot, 30-day trends, total work hours
- Leaves: apply, edit, approve / reject, balance calculation
- Departments: CRUD with head-of-department relation
- Notifications: per-user feed with read tracking
- File uploads via multer (profile pictures)

## Tech stack

- Node.js, Express 5
- MongoDB, Mongoose 9
- bcrypt, jsonwebtoken, cookie-parser
- multer, cors, dotenv

## Setup

Prerequisites: Node.js 20+, npm 10+, a running MongoDB instance.

```bash
git clone <backend-repo> hrms_backend
cd hrms_backend
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, REFRESH_SECRET
npm install
npm run dev                 # http://localhost:5000
```

## Environment variables

See `.env.example`. Required: `MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET`. Optional: `PORT` (defaults to 5000).

## API surface

| Prefix | Purpose |
|---|---|
| `/api/auth` | login, refresh, logout, profile |
| `/api/employee` | employee CRUD + profile + change-password |
| `/api/department` | department CRUD |
| `/api/attendance` | punch-in / out, history, snapshots, stats |
| `/api/leave` | apply, list, approve / reject, balance |
| `/api/notifications` | list, mark-read, unread count |
| `/uploads/...` | static profile images |

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start with `node` |
| `npm run lint` | (no lint configured yet) |
| `npm test` | (no tests configured yet — planned for P1) |

## Project structure

```
config/         # mongoose connection
controllers/    # request handlers
middleware/     # auth, role, multer
models/         # mongoose schemas
routes/         # express routers
utils/          # date helpers, status calculator
uploads/        # served as /uploads/*
server.js       # entry point
```

## License

ISC.

## Author

Thansiya P