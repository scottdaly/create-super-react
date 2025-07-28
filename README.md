# create-super-react

An npm initializer that scaffolds a production‑ready full‑stack starter:

* **Frontend:** Vite • React • TypeScript • Tailwind CSS v4
* **Backend:** Bun • Hono • SQLite (via `bun:sqlite`)

**Default preset:** **Google OAuth (PKCE)** with secure cookie sessions, **CSRF protection** (synchronizer nonce + Origin check), and routes for home/login/dashboard/settings.
Use `--password-auth` to add email/password authentication alongside Google OAuth.
Use `--minimal` to generate a lean variant **without auth**.

---

## Quick start

```bash
# Google OAuth only (default)
npm create super-react@latest my-app

# Google OAuth + Email/Password auth
npm create super-react@latest my-app -- --password-auth

# Minimal (no auth)
npm create super-react@latest my-app -- --minimal
```

Then, in two terminals:

```bash
# API (Bun)
cd my-app/backend
bun run dev     # http://localhost:3000

# Web (Vite)
cd ../frontend
npm run dev     # http://localhost:5173
```

> For **Google login**, complete the **Google OAuth setup** below; the backend ships a helpful error until configured.

---

## Prerequisites

* **Node.js ≥ 18** (for the CLI and frontend tooling)
* **npm** (bundled with Node)
* **Bun** (backend runtime) — install from [https://bun.sh](https://bun.sh)
* **Git** (optional)

> **Windows note:** you don't need `chmod` for the CLI; it runs via the Node/npm shim.

---

## What gets generated

```
my-app/
├─ frontend/   # Vite + React + TS + Tailwind v4 (+ React Router, CSRF helper, Google auth)
└─ backend/    # Bun + Hono + SQLite API (Google OAuth + CSRF + optional password auth)
```

**Docs:** The generator also writes a root **`CLAUDE.md`** whose content is **tailored to the preset**:

* **Google-only preset (default):** includes Google OAuth setup, CSRF/session details, routes, and security defaults.
* **Password auth preset (`--password-auth`):** adds email/password forms, signup/login endpoints, and password hashing.
* **Minimal preset (`--minimal`):** slim overview of the stack and sample endpoints, no auth.

---

## Authentication Presets

### Google OAuth Only (Default)

* **Frontend routes:**
  * `/` (public homepage)
  * `/login` (Google "Continue with Google" button only)
  * `/dashboard`, `/settings` (protected)
* **Backend:** Google OAuth PKCE flow, secure sessions, CSRF protection
* **No dependencies on:** `lucide-react`, `zod` (password validation)

### Google OAuth + Password Auth (`--password-auth`)

* **Frontend routes:**
  * `/` (public homepage)  
  * `/login`, `/signup` (email/password forms + **Continue with Google** button)
  * `/dashboard`, `/settings` (protected)
* **Backend:** All Google OAuth features + local auth (scrypt password hashing)
* **Additional features:** Password change, signup validation, show/hide password toggles
* **Extra dependencies:** `lucide-react` (password icons), `zod` (validation)

### Minimal (`--minimal`)

* Backend exposes `GET /api/health`, and `GET/POST /api/todos` using SQLite.
* CORS is enabled in this preset for convenience.
* Frontend is a standard Vite + React + TS app with Tailwind; no router/auth added.

---

## Frontend Features

* **Auth context** (`AuthProvider`/`useAuth`) backed by `/api/auth/session`.
* **`apiFetch` helper** automatically attaches **CSRF headers** on unsafe requests and includes cookies.
* **Tailwind v4** via `@tailwindcss/vite` and `@import "tailwindcss";` in `src/index.css`.
* **Dev proxy:** `/api` → `http://localhost:3000` so cookie sessions work during local dev.
* **Modern UI components:** Navbar, Avatar with dropdown menu, Modal, Account Settings page

## Backend Features

* **SQLite tables:**
  * `users` (email, optional password_hash for `--password-auth`)
  * `sessions` (stores **hash** of the session token + a per‑session CSRF secret)
  * `oauth_accounts` and `oauth_states` (for Google PKCE flow)
* **Session management:** **httpOnly** cookie session (`sid`) with `SameSite=Lax`, `Secure` in production; 30‑day TTL; rotation on login.
* **CSRF:** synchronizer token with **short‑lived nonce** (10 minutes) + **Origin/Referer** validation for `POST/PUT/PATCH/DELETE`.
* **Core endpoints:**
  * `POST /api/auth/logout`
  * `GET  /api/auth/session` → `{ id, email } | null`
  * `GET  /api/auth/csrf` → `{ nonce, token, exp }`
  * `DELETE /api/account` → delete user account
  * `GET  /api/me` (example protected)
  * **Google OAuth:** `GET /api/auth/google/start`, `GET /api/auth/google/callback`
* **Password auth endpoints** (when `--password-auth` is used):
  * `POST /api/auth/signup`, `POST /api/auth/login`
  * `PUT /api/account/password` → change password
* **Basic rate limiting** (in‑memory) for signup/login.

---

## Google OAuth setup (required for auth presets)

The generator writes `backend/.env.example`. Create `backend/.env` and fill:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_ORIGIN=http://localhost:5173
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

In **Google Cloud Console** → **Credentials** → **OAuth 2.0 Client IDs** (Web application):

* Add **Authorized redirect URI** exactly as `OAUTH_REDIRECT_URI`.
* Copy **Client ID** and **Client Secret** into your `.env`.

Restart the backend, open `/login`, and click **Continue with Google**.

---

## Security defaults

* **Cookie sessions** (httpOnly + `SameSite=Lax`; add `Secure` in production)
* **CSRF synchronizer nonce** + **Origin/Referer** checks on unsafe methods
* **No state changes on GET** routes
* **Session rotation** on login and 30‑day TTL; deleting a session row revokes that device immediately
* **Password security** (when `--password-auth`): scrypt hashing with per‑user salt, 8+ character minimum

> If you deploy frontend and backend on different **origins**, you'll need CORS and likely `SameSite=None; Secure` cookies. CSRF protection remains required for unsafe methods.

---

## Environment variables (backend)

* `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — required for Google login
* `FRONTEND_ORIGIN` — defaults to `http://localhost:5173` in dev; set to your site in prod
* `OAUTH_REDIRECT_URI` — defaults to `http://localhost:3000/api/auth/google/callback`
* (Standard vars like `NODE_ENV` also apply)

---

## Troubleshooting

* **"Google OAuth not configured"** → Fill `.env` as above.
* **"Bad origin"** on unsafe requests → Set `FRONTEND_ORIGIN` to your frontend URL.
* **CSRF errors** ("missing/invalid/expired") → Use `apiFetch` or manually call `/api/auth/csrf` and send `X‑CSRF‑Nonce`/`X‑CSRF‑Token` with cookies.
* **Bun not found** → Install Bun and restart your shell.
* **Vite proxy not applied** → If `vite.config.*` wasn't patched, add a dev proxy from `/api` to `http://localhost:3000`.

---

## Developing this CLI (for maintainers)

Run locally without publishing:

```bash
node index.js demo-app         # generate into ./demo-app
# or
npm link                       # create a global shim
create-super-react demo-app    # run as a command
```

Verify package contents before publishing:

```bash
npm pack --dry-run
```

Publish a new version:

```bash
npm version patch
npm publish
```

**Implementation notes:**

* The CLI itself is a zero‑dependency Node ESM file with a shebang.
* It installs framework deps **only into the generated app**.
* It writes a preset‑specific **`CLAUDE.md`** (Google-only vs password auth vs minimal).

---

## License

MIT © 2025 Scott Daly
