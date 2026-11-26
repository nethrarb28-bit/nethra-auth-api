# Nethra R — Authentication & Database Integration (Task 4)

Complete user authentication system and protected resource API built with **Node.js**, **Express**, **SQLite (`sql.js`)**, **bcryptjs**, and **JSON Web Tokens (JWT)** for **Task 4: Authentication & Database Integration** of the YR NOVATECH internship.

---

## Features

- **User Registration (`POST /api/auth/signup`)**: Validates name, email, and password strength, hashes passwords with bcrypt (`10` salt rounds), stores the user in SQLite, and issues a session token.
- **User Login (`POST /api/auth/login`)**: Verifies credentials against stored bcrypt hashes and returns a signed JWT plus an `HttpOnly` session cookie.
- **Session Logout (`POST /api/auth/logout`)**: Invalidates the active JWT in the database `revoked_tokens` blacklist and clears the session cookie.
- **Password Reset Flow (`POST /api/auth/forgot-password` & `POST /api/auth/reset-password`)**: Generates a cryptographically random 15-minute reset token, verifies expiration, and updates the stored password hash.
- **Protected Routes (`GET /api/auth/me`, `GET/POST/DELETE /api/notes`)**: Enforces authentication middleware (`requireAuth`) so users can only view and manage their own private notes.
- **Built-In Test Interface (`/`)**: Interactive browser UI included in `public/index.html` for testing all auth flows directly on localhost or Vercel.

---

## Folder Structure

```text
nethra-auth-api/
├── db/
│   └── database.js              # SQLite (sql.js) setup, tables, and query helpers
├── middleware/
│   ├── authMiddleware.js        # JWT & cookie verification + revocation check
│   └── validate.js              # Input & form validation rules
├── public/
│   └── index.html               # Interactive Auth & Protected Routes UI
├── routes/
│   ├── auth.js                  # Signup, login, logout, password reset, /me
│   └── protected.js             # Protected user-scoped notes CRUD routes
├── .env.example                 # Environment variable template
├── .gitignore                   # Ignored files (node_modules, .env, local db)
├── AUTH_SECURITY_DOCS.md        # Detailed auth flow & security documentation
├── package.json                 # Dependencies and start scripts
├── README.md                    # Project overview, endpoints, and setup guide
├── server.js                    # Express server and error handlers
└── vercel.json                  # Vercel serverless deployment routing
```

---

## Database Schema

1. **`users` Table**: `id`, `name`, `email` (UNIQUE), `password_hash`, `reset_token`, `reset_expires`, `created_at`, `updated_at`
2. **`notes` Table**: `id`, `user_id` (FK -> `users.id`), `title`, `content`, `created_at`
3. **`revoked_tokens` Table**: `id`, `token` (UNIQUE), `revoked_at`

---

## Local Setup & Running

```bash
npm install
npm start
```

Open `http://localhost:3000` in your browser to test Sign-Up, Login, Password Reset, Logout, and Protected Notes.
