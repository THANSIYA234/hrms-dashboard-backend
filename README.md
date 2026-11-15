# HRMS Backend

Express 5 + Mongoose 9 API for the HRMS Dashboard. Handles authentication, employee / department CRUD, attendance, leave workflow, and notifications.

## Features

- Cookie-based sessions: httpOnly access + refresh tokens, refresh-token rotation with replay detection
- CSRF double-submit protection on all state-changing requests
- Zod validation on every route, so unknown body keys can never be mass-assigned
- Account lockout after 5 failed logins and a non-enumerating login response
- Role-based authorization (`admin`, `employee`)
- Attendance: punch-in / punch-out, daily snapshot, 30-day trends, total work hours
- Leaves: apply, edit, approve / reject, balance calculation
- Departments: CRUD with head-of-department relation
- Notifications: per-user feed with read tracking
- Hardened profile-picture uploads (magic-byte sniffing, UUID filenames, 2MB cap)
- Structured request logging (pino) with credential redaction

## Tech stack

- Node.js, Express 5
- MongoDB, Mongoose 9
- bcrypt, jsonwebtoken, cookie-parser
- helmet, compression, express-rate-limit, zod
- multer, cors, dotenv, pino / pino-http
- vitest, supertest, mongodb-memory-server

## Setup

Prerequisites: Node.js 20+, npm 10+, a running MongoDB instance.

```bash
git clone <backend-repo> hrms_backend
cd hrms_backend
cp .env.example .env        # fill in MONGO_URI, JWT_SECRET, REFRESH_SECRET
npm install
npm run seed                # prints a demo admin password once
npm run dev                 # http://localhost:5000
```

`npm run seed` refuses to overwrite an existing account; pass `-- --force` to reset its password.

## Environment variables

See `.env.example`. Required: `MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET`, `CORS_ORIGINS`.

`NODE_ENV` is what decides the cookie policy:

| `NODE_ENV` | Cookies | When |
|---|---|---|
| `development` | `SameSite=Lax`, `Secure=false` | localhost over http |
| `production` | `SameSite=None`, `Secure=true` | frontend on a different domain, always https |

Because development cookies are `Lax`, the frontend and this API must use the **same hostname**
(both `localhost` — mixing `localhost` and `127.0.0.1` silently drops the session).

## API surface

| Prefix | Purpose |
|---|---|
| `/api/auth` | login, refresh, logout, me, profile |
| `/api/employee` | employee CRUD + profile + change-password |
| `/api/department` | department CRUD |
| `/api/attendance` | punch-in / out, history, snapshots, stats |
| `/api/leave` | apply, list, approve / reject, balance |
| `/api/notifications` | list, mark-read, unread count |
| `/api/files` | authenticated profile images |
| `/healthz`, `/readyz` | liveness / readiness probes |

Errors always use `{ "error": { "code", "message" } }` so clients can branch on `code`.

## Authentication

There is no `Authorization` header and no token in `localStorage`. Login returns
`{ user, csrfToken }` and sets two httpOnly cookies:

- `accessToken` — 15 min, `Path=/api`
- `refreshToken` — 7 days, `Path=/api/auth`, stored in Mongo only as a SHA-256 hash

`POST /api/auth/refresh` rotates both cookies. Presenting an already-rotated
refresh token is treated as a replay and drops the session.

Because the session rides on cookies, state-changing requests must also echo the
`csrfToken` in an `X-CSRF-Token` header; the server compares it against the
`XSRF-TOKEN` cookie. `login`, `refresh` and `logout` are exempt. `GET /auth/me`
returns the current token so a freshly loaded page can seed it.

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start with `node` |
| `npm run lint` / `lint:fix` | ESLint |
| `npm test` | Vitest suite (in-memory MongoDB, no running database needed) |
| `npm run seed` | Create / reset the demo admin and print its password |

## Project structure

```
app.js          # express app (exported for tests)
server.js       # entry point: db connect, listen, graceful shutdown
config/         # mongoose connection, cookie policy
controllers/    # request handlers
middleware/     # auth, role, csrf, uploads, rate limits, validation, errors
models/         # mongoose schemas
routes/         # express routers
scripts/        # seed script
test/           # vitest + supertest suites
validators/     # zod schemas per resource
utils/          # date helpers, status calculator
uploads/        # profile pictures (served through /api/files, authenticated)
```

## License

ISC.

## Author

Thansiya P