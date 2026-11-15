# Changelog

All notable changes to the HRMS backend.

## [1.1.0] — 2026-10-22

Security hardening (Phase P1 of `PROJECT_PLAN.md`).

### Added

- httpOnly `accessToken` (15 min) and `refreshToken` (7 d) cookies; access tokens
  are no longer returned to the client.
- Refresh-token rotation with a unique `jti`, SHA-256 storage
  (`User.refreshTokenHash`), and replay detection that drops the session.
- CSRF double-submit middleware (`XSRF-TOKEN` cookie + `X-CSRF-Token` header).
- `GET /api/auth/me`, derived from the verified token, no database round trip.
- Zod validation middleware and per-resource schemas; `req.body` / `req.params` /
  `req.query` are replaced with the parsed result, which also removes the
  mass-assignment surface on `PUT /api/employee/:id` and `PUT /api/employee/update-Profile`.
- Account lockout after 5 failed logins (`423 ACCOUNT_LOCKED`) and a single
  non-enumerating failure response.
- Authenticated `/api/files` profile-picture proxy replacing the two public
  `express.static("uploads")` mounts.
- Upload hardening: magic-byte sniffing, `crypto.randomUUID()` filenames,
  2 MB / 1 file limit, extension derived from the sniffed type.
- `GET /healthz` (liveness) and `GET /readyz` (Mongo ping).
- Global error handler mapping ZodError / Mongoose / CastError / 11000 / Multer
  into `{ error: { code } }`.
- Rate limiting: 20 per 15 min on auth routes, 300 per minute globally.
- `scripts/seed.js` — creates the demo admin and prints its password once.
- pino request logging with credential redaction; `app.js` split out of
  `server.js` so the app can be mounted in tests.
- Vitest + supertest + mongodb-memory-server suite (31 tests).

### Changed

- `authMiddleware` reads the cookie and trusts the signed JWT payload instead of
  doing a `User.findById` on every request.
- `User.email` is lowercased/trimmed/matched; `failedLoginAttempts` and
  `lockUntil` added.
- CORS origins come from `CORS_ORIGINS` instead of a hardcoded list.
- Body payloads are capped at 100 kB; `trust proxy` is enabled.
- Removed the `POST /api/notifications` route: its handler was an internal
  helper called with `(req, res)`, and no client used it.
- `GET /api/attendance/total-hours/department` is now reachable — it was
  previously shadowed by `/total-hours/:employeeId`.

### Notes

`express-mongo-sanitize` and `hpp` were evaluated and **not** adopted: on Express
5 `req.query` is a getter-only property, so the former throws on every request
and the latter mutates a throwaway object. The per-route zod schemas are an
allowlist, which is a stronger guarantee than either blocklist.

## [1.0.0]

Initial release.