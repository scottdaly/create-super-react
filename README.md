# create-super-react

**An npm initializer that scaffolds a full‑stack project with:**

* **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
* **Backend:** Bun + Hono + SQLite (via `bun:sqlite`)

It builds a two-folder layout:

```
my-app/
  frontend/   # Vite + React + TS + Tailwind v4
  backend/    # Bun + Hono + SQLite API
```

---

## Quick Start

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

> The frontend calls the backend at `http://localhost:3000`. CORS is enabled by default in the generated API.

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
├─ frontend/
│  ├─ src/
│  │  ├─ main.tsx
│  │  ├─ App.tsx
│  │  └─ index.css       # Tailwind v4 is imported here
│  ├─ index.html
│  ├─ vite.config.(ts|js)  # Tailwind Vite plugin added
│  └─ package.json
└─ backend/
   ├─ src/
   │  └─ index.ts        # Hono app + SQLite example routes
   ├─ .gitignore         # ignores data.sqlite
   └─ package.json (Bun)
```

### Frontend (Vite + React + TS + Tailwind v4)

* Tailwind v4 is installed and wired using the official Vite plugin (`@tailwindcss/vite`).
* Your `src/index.css` already contains:

```css
@import "tailwindcss";
```

* The plugin is added to `vite.config` so Tailwind works out of the box.

### Backend (Bun + Hono + SQLite)

* A Hono server exposing:

  * `GET /api/health` → `{ ok: true }`
  * `GET /api/todos` → list todos
  * `POST /api/todos` → `{ title: string }` to insert
* SQLite is created as `backend/data.sqlite` if it doesn’t exist.

Example API calls:

```bash
# Health check
curl http://localhost:3000/api/health

# List todos
curl http://localhost:3000/api/todos

# Create a todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"try the new stack"}'
```

Use it from React:

```ts
const res = await fetch('http://localhost:3000/api/todos');
const todos = await res.json();
```

---

## Customization Tips

* **Ports**: Backend defaults to `3000`, frontend to `5173`. Adjust as needed.
* **Database**: Replace raw `bun:sqlite` queries with an ORM like Drizzle if you prefer.
* **Env**: Add `.env` files in `backend` and `frontend` as your project grows.
* **Monorepo tooling**: Add a root `package.json` and tools like `concurrently`, `turbo`, or `biome` if you want combined scripts/linting.

---

## Troubleshooting

* **“bun: command not found”** → Install Bun and reopen your terminal.
* **Vite config not found** → The initializer expects a standard Vite layout. If templates change, update the CLI or manually add the Tailwind plugin and `@import` in CSS.
* **Windows line endings** → If you edit the CLI on Windows and run on macOS/Linux, ensure LF line endings for scripts with shebangs.

---

## Developing this CLI (for maintainers)

Clone the repo and work inside the CLI folder:

```bash
node index.js demo-app         # run locally without publishing
# or
npm link                       # creates a global shim
create-super-react demo-app    # now available as a command
```

Before publishing, verify the package contents:

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
* **Cross‑platform scaffolding**: runs `npm create vite@latest` and `bun create hono@latest` from the project **root** (`cwd: my-app`) and targets **relative** folders (`frontend`, `backend`) to avoid Windows/mac path quirks.
* **Tailwind v4 wiring** in the frontend only:

  * Installs `tailwindcss` and `@tailwindcss/vite` in `my-app/frontend`.
  * Injects `import tailwindcss from '@tailwindcss/vite'` and ensures `plugins: [tailwindcss()]` exists in `vite.config.*`.
  * **Prepends** `@import "tailwindcss";` to the main CSS (without deleting Vite’s default styles).
* **Backend seed**: uses `bun create hono@latest` (template: bun) and replaces `backend/src/index.ts` with a minimal Hono API wired to `bun:sqlite` (`data.sqlite` auto-created). Appends `/data.sqlite` to `backend/.gitignore`.
* **Safety checks**: verifies Node ≥ 18, ensures `bun` is on PATH, and refuses to scaffold into a non‑empty directory unless `--force` is passed.
* **Docs**: writes a `CLAUDE.md` summarizing structure, stack, and dev commands.
* **Why no lockfile/deps in this CLI?** Keeping the initializer lean makes installs faster and avoids shipping framework/tooling that belongs in the generated project.

## Roadmap

* Flags to opt into extras (ESLint/Prettier, CI, Docker, Drizzle)
* Root workspace scripts to run both servers together
* Example proxy setup for local dev

---

## License

MIT © 2025 Scott Daly
