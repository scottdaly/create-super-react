# create-super-react

**An npm initializer that scaffolds a full‑stack project with:**

* **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
* **Backend:** Bun + Hono + SQLite (via `bun:sqlite`)

**Default behavior:** projects are scaffolded **with local auth** (secure cookie sessions + scrypt), **CSRF protection (synchronizer nonce + Origin check)**, and **Google OAuth (PKCE)** providing a homepage, login, signup, and a protected dashboard. Use `--minimal` for a non‑auth version.

It builds a two-folder layout:

```
my-app/
  frontend/   # Vite + React + TS + Tailwind v4
  backend/    # Bun + Hono + SQLite API
```

---

## Quick Start

**Default (with auth + CSRF + Google OAuth support):**

```bash
npm create super-react@latest my-app
```

Then, in two terminals:

```bash
# Terminal 1 (API)
cd my-app/backend
bun run dev   # http://localhost:3000

# Terminal 2 (Web)
cd my-app/frontend
npm run dev   # http://localhost:5173
```

> Local auth works out of the box. To enable **Google login**, complete the **Google OAuth Setup** below (the "Continue with Google" button appears either way; without configuration the backend will return a helpful error).

**Minimal (no auth):**

```bash
npm create super-react@latest my-app -- --minimal
```

---

## Prerequisites

* **Node.js ≥ 18** (for running the initializer and the frontend tooling)
* **npm** (bundled with Node)
* **Bun** (for the backend) – install from [https://bun.sh](https://bun.sh)
* **Git** (optional, but recommended)

> On Windows, you don’t need `chmod`; the initializer runs via Node/npm shims.

---

## What Gets Generated

### Folder Structure

```
my-app/
├─ frontend/   # Vite + React + TS + Tailwind v4 (+ React Router, CSRF helper, Google button when auth enabled)
└─ backend/    # Bun + Hono + SQLite API (local auth + CSRF + Google OAuth)
```

### Frontend (auth preset – default)

* **React Router** with routes:

  * `/` (public homepage)
  * `/login`, `/signup` (auth forms with a **Continue with Google** button)
  * `/dashboard` (protected)
* **Auth context** (`AuthProvider` / `useAuth`) that calls `/api/auth/session` and keeps the user in state.
* **`apiFetch` helper** that automatically attaches **CSRF headers** to unsafe requests.
* **Tailwind v4** wired via `@tailwindcss/vite` and `@import "tailwindcss";` in `src/index.css`.
* **Dev proxy**: `/api` → `http://localhost:3000` so cookie auth works in dev without cross‑site requests.

### Backend (auth preset – default)

* **SQLite tables**: `users`, `sessions`, plus OAuth tables `oauth_accounts`, `oauth_states`.
* **Password hashing**: **scrypt** (Node crypto) with per‑user salt.
* **Sessions**: httpOnly cookie (`sid`), `SameSite=Lax`, `Secure` in production, 30‑day TTL, rotation on login; session token is stored **hashed** in DB.
* **CSRF**: synchronizer token with **short‑lived nonce** (10 min) + **Origin/Referer check** on `POST/PUT/PATCH/DELETE`. CSRF is **skipped only** for `/api/auth/login` and `/api/auth/signup` (before a session exists). Logout **requires** CSRF.
* **Endpoints**:

  * `POST /api/auth/signup`
  * `POST /api/auth/login`
  * `POST /api/auth/logout`
  * `GET  /api/auth/session` → `{ id, email } | null`
  * `GET  /api/auth/csrf` → `{ nonce, token, exp }`
  * `GET  /api/me` (example protected)
  * **Google OAuth:**

    * `GET /api/auth/google/start` (redirects to Google)
    * `GET /api/auth/google/callback` (handles code exchange, creates session, redirects to `/dashboard`)
* **Basic rate limiting** for signup/login.

### Minimal preset (when `--minimal` is passed)

* Backend exposes:

  * `GET /api/health`
  * `GET /api/todos` and `POST /api/todos` (simple example using SQLite)
  * (CORS is enabled in this minimal API for convenience.)
* Frontend is the standard Vite + React + TS setup with Tailwind; no router/auth added.

---

## Google OAuth Setup (optional but recommended)

The initializer writes `backend/.env.example`. Create `backend/.env` and fill:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_ORIGIN=http://localhost:5173
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Then in **Google Cloud Console** → **Credentials** → **OAuth 2.0 Client IDs** → *Web application*:

* Add **Authorized redirect URI** exactly as `OAUTH_REDIRECT_URI`.
* Use the **Client ID** and **Client Secret** above.

Restart the backend, visit `/login`, and click **Continue with Google**.

---

## Security defaults

* **Cookie sessions** with httpOnly + `SameSite=Lax` (and `Secure` in production).
* **CSRF synchronizer nonce** for all unsafe methods (except login/signup before session) + **Origin/Referer validation** against `FRONTEND_ORIGIN`.
* **GET endpoints are read‑only** by convention; do not mutate state in GET.
* **Session rotation** on login, 30‑day TTL. Deleting a session row revokes that device immediately.

> If you later deploy the frontend and backend on different **origins**, you’ll need to configure CORS and may need `SameSite=None; Secure` cookies. CSRF protection remains required for unsafe methods.

---

## Customization Tips

* **Ports**: Backend defaults to `3000`, frontend to `5173`. Adjust Vite proxy and `FRONTEND_ORIGIN` if you change them.
* **Env**: Start from `backend/.env.example`. Add more env as your project grows.
* **Database**: Replace raw `bun:sqlite` queries with an ORM like Drizzle if you prefer.
* **Monorepo tooling**: Add a root `package.json` and tools like `concurrently`, `turbo`, or `biome` if you want combined scripts/linting.

---

## Troubleshooting

* **"Google OAuth not configured"** → Create `backend/.env` from the provided example and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `OAUTH_REDIRECT_URI`.
* **"Bad origin"** on unsafe requests → Set `FRONTEND_ORIGIN` in `backend/.env` to your dev/prod frontend URL.
* **CSRF errors** ("token missing/invalid/expired") → The frontend’s `apiFetch` refreshes tokens automatically; if calling the API manually, first fetch `/api/auth/csrf` and send `X-CSRF-Nonce` and `X-CSRF-Token` headers along with your cookies.
* **“bun create … too many arguments” on Windows** → The initializer already uses the correct flags; if running by hand, prefer:

  * `bun create hono@latest backend --template bun --install --pm bun`
  * or `npm create hono@latest backend -- --template bun --install --pm bun`
* **“bun: command not found”** → Install Bun and reopen your terminal.
* **Vite config not found** → Manually add Tailwind (`@tailwindcss/vite`) and, if using auth, the `/api` proxy in `vite.config.*`.

---

## Developing this CLI (for maintainers)

Run locally without publishing:

```bash
node index.js demo-app         # generate into ./demo-app
# or
npm link                       # creates a global shim
create-super-react demo-app    # now available as a command
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

> Keep the CLI’s own `package.json` **lean** (no Tailwind/Vite dependencies). Those are installed inside the generated `frontend/` app only.

---

## How this initializer (index.js) was built

* **Zero-dependency Node ESM script** with a shebang (`#!/usr/bin/env node`). The CLI itself ships only `index.js` and `package.json`; all framework deps are installed **inside the generated app**.
* **Cross‑platform scaffolding**: runs `npm create vite@latest` and `bun create hono@latest` from the project **root** (`cwd: my-app`) and targets **relative** folders (`frontend`, `backend`).
* **Tailwind v4 wiring** in the frontend only.
* **Auth preset (default)**: React Router pages, Vite proxy, secure local auth (scrypt + cookie sessions + rotation + basic rate limiting), **CSRF synchronizer nonce + Origin check**, and **Google OAuth (PKCE)**.
* **`--minimal` flag**: skips auth and generates the simpler example API (health/todos) and a plain Vite app.
* **Safety checks**: Node ≥ 18, Bun on PATH, refuse to scaffold into non‑empty dir unless `--force`.
* **Docs**: writes a `CLAUDE.md` summarizing structure, stack, and dev commands.

## Roadmap

* Password reset + email verification flows
* Optional ORMs (e.g., Drizzle) and schema migrations
* Lucia‑based preset for OAuth/WebAuthn & passkeys
* Root workspace scripts to run both servers together via `concurrently`
* Optional session stores (SQLite/Postgres/Redis) for multi‑instance scaling

## License

MIT © 2025 Scott Daly
