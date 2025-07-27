#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const run = (cmd, opts={}) => execSync(cmd, { stdio: "inherit", ...opts });

async function findFile(dir, names) {
  for (const n of names) {
    try { await fs.access(path.join(dir, n)); return path.join(dir, n); } catch {}
  }
  return null;
}

async function main() {
  const [, , appName = "my-app"] = process.argv;
  const root = path.resolve(process.cwd(), appName);
  const frontend = path.join(root, "frontend");
  const backend  = path.join(root, "backend");

  await fs.mkdir(root, { recursive: true });

  // --- FRONTEND (use cwd: root and a relative folder name) ---
  run(`npm create vite@latest frontend -- --template react-ts`, { cwd: root });

  // install tailwind v4 + vite plugin as dev deps
  run(`npm i -D tailwindcss @tailwindcss/vite`, { cwd: frontend });

  // pick whichever vite config exists
  const viteCfgPath = await findFile(frontend, [
    "vite.config.ts", "vite.config.js", "vite.config.mts", "vite.config.mjs"
  ]);

  if (!viteCfgPath) {
    throw new Error("Could not find a Vite config in frontend/ after scaffolding.");
  }

  // add tailwind plugin if missing
  let viteCfg = await fs.readFile(viteCfgPath, "utf8");
  if (!viteCfg.includes("@tailwindcss/vite")) {
    if (!viteCfg.includes("from 'vite'") && !viteCfg.includes('from "vite"')) {
      // very defensive: ensure vite import exists
      viteCfg = `import { defineConfig } from 'vite'\n${viteCfg}`;
    }
    viteCfg = `import tailwindcss from '@tailwindcss/vite'\n` + viteCfg;
    viteCfg = viteCfg.replace(/plugins:\s*\[([^\]]*)\]/, (m, inner) => {
      return `plugins: [${inner ? inner.trim() + ", " : ""}tailwindcss()]`;
    });
    await fs.writeFile(viteCfgPath, viteCfg);
  }

  // ensure Tailwind is active via CSS entry
  const cssPath = path.join(frontend, "src", "index.css");
  await fs.writeFile(cssPath, `@import "tailwindcss";\n`);

  // --- BACKEND (also run from root using relative folder) ---
  run(`bun create hono@latest backend -- --template bun --install --pm bun`, { cwd: root });

  // replace backend entry with a Hono + bun:sqlite sample
  const backendIndex = `
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Database } from 'bun:sqlite'

const app = new Hono()
app.use('*', cors())

const db = new Database('data.sqlite')
db.run('CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)')

app.get('/api/health', (c) => c.json({ ok: true }))
app.get('/api/todos', (c) => c.json(db.query('SELECT id, title, done FROM todos ORDER BY id DESC').all()))
app.post('/api/todos', async (c) => {
  const body = await c.req.json()
  if (!body?.title) return c.json({ error: 'title required' }, 400)
  db.query('INSERT INTO todos (title, done) VALUES (?, ?)').run(body.title, 0)
  return c.json({ ok: true }, 201)
})

export default app
`.trimStart();

  await fs.writeFile(path.join(backend, "src", "index.ts"), backendIndex);
  await fs.appendFile(path.join(backend, ".gitignore"), `\n/data.sqlite\n`);

  console.log(`\nDone. Next:
  cd ${appName}
  cd backend && bun run dev   # http://localhost:3000
  # new terminal
  cd ${appName}/frontend && npm run dev   # http://localhost:5173`)
}

main().catch((e) => (console.error(e), process.exit(1)));
