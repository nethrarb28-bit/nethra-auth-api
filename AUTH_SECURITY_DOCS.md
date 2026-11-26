# Authentication Flow & Security Measures Documentation

## 1. End-to-End Authentication Flow

### A. Sign-Up (`POST /api/auth/signup`)
1. Client submits `{ "name": "Nethra R", "email": "nethra@example.com", "password": "secret123" }`.
2. `validateSignup` middleware checks required fields, email format, and minimum password length (6 characters).
3. Database is queried to prevent duplicate email registration (`409 Conflict` if already registered).
4. Password is hashed using `bcryptjs.hash(password, 10)` before saving to SQLite.
5. Server signs a JWT (`2h` expiration) and sets an `HttpOnly; SameSite=Lax` cookie, returning `201 Created`.

### B. Login & Session Management (`POST /api/auth/login`)
1. Client submits `{ "email": "...", "password": "..." }`.
2. Server looks up the user by normalized lowercase email and compares the password using constant-time `bcrypt.compare()`.
3. On match, a signed JWT (`id`, `email`, `name`) is issued in both the JSON response (`Authorization: Bearer <token>`) and an `HttpOnly` cookie.

### C. Protected Route Authorization (`GET /api/auth/me` & `/api/notes`)
1. `requireAuth` middleware extracts the token from the `Authorization: Bearer` header or `token` cookie.
2. Middleware checks `revoked_tokens` to ensure the user has not logged out.
3. `jwt.verify()` validates signature integrity and expiration (`401 Unauthorized` if invalid/expired).
4. Authenticated user context is attached to `req.user`, scoping all database queries to `user_id = req.user.id`.

### D. Logout (`POST /api/auth/logout`)
1. Server records the active token in `revoked_tokens` so it cannot be reused even before its expiry timestamp.
2. Server clears the `token` cookie (`Max-Age=0`).

### E. Password Reset (`POST /api/auth/forgot-password` -> `POST /api/auth/reset-password`)
1. `forgot-password` generates a 32-character cryptographic hex token via `crypto.randomBytes(16)` with a 15-minute expiration timestamp (`Date.now() + 15 * 60 * 1000`).
2. `reset-password` verifies the email, matches `reset_token`, confirms it has not expired, hashes the new password with bcrypt, and clears `reset_token` and `reset_expires` so tokens are single-use.

---

## 2. Security Measures Implemented

- **No Plaintext Passwords**: All passwords are salted and hashed with `bcryptjs` (`10` rounds) prior to storage.
- **Generic Login Failure Messages**: Returns `"Invalid email or password."` for both unknown emails and wrong passwords to prevent user enumeration during login.
- **Token Revocation & Expiration**: JWTs expire automatically (`2h`) and are immediately invalidated on logout via server-side revocation tracking.
- **HttpOnly & SameSite Cookies**: Session cookies use `HttpOnly` to mitigate XSS token theft and `SameSite=Lax` to protect against CSRF.
- **Parameterized SQL Queries**: All SQLite queries use `?` parameter binding to prevent SQL injection.
- **Strict Input Validation & Centralized Error Handling**: Malformed payloads are rejected with `400 Bad Request` before hitting database logic, and internal stack traces are never leaked to clients.
