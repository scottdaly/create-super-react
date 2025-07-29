#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyTemplateLayer, getClaudeMdContent } from "./lib/templates.js";
import { select, textInput, close as closePrompts } from "./lib/prompts.js";

const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });
const tryRun = (cmd, opts = {}) => {
  try { execSync(cmd, { stdio: "inherit", ...opts }); return true; }
  catch { return false; }
};
const log = (msg = "") => console.log(msg);

// ----------------------------- helpers -------------------------------------

async function ensureTool(cmd, versionArg = "--version", hint = "") {
  try { execSync(`${cmd} ${versionArg}`, { stdio: "ignore" }); }
  catch { console.error(`❌ Missing tool: ${cmd}. ${hint}`); process.exit(1); }
}

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function dirIsEmpty(dir) { try { const e = await fs.readdir(dir); return e.length === 0; } catch { return true; } }

async function findFile(dir, names) {
  for (const n of names) {
    const full = path.join(dir, n);
    if (await exists(full)) return full;
  }
  return null;
}

/** Add Tailwind plugin import + plugins: [tailwindcss()] to vite.config.* */
function addTailwindToViteConfig(src) {
  let out = src;
  if (!/['"]@tailwindcss\/vite['"]/.test(out)) {
    out = `import tailwindcss from '@tailwindcss/vite'\n` + out;
  }
  const pluginsRe = /plugins\s*:\s*\[([\s\S]*?)\]/m;
  if (pluginsRe.test(out)) {
    if (!/tailwindcss\(\)/.test(out)) {
      out = out.replace(pluginsRe, (m, inner) => {
        const trimmed = inner.trim();
        return `plugins: [${trimmed ? trimmed + ", " : ""}tailwindcss()]`;
      });
    }
    return out;
  }
  const defineRe = /defineConfig\(\s*\{([\s\S]*?)\}\s*\)/m;
  if (defineRe.test(out)) {
    const candidate = out.replace(defineRe, (m, inner) => {
      if (/plugins\s*:/.test(inner)) return m;
      return `defineConfig({\n  plugins: [tailwindcss()],\n${inner}\n})`;
    });
    const count = (candidate.match(/plugins\s*:/g) || []).length;
    if (count <= (out.match(/plugins\s*:/g) || []).length + 1) return candidate;
  }
  if (!/defineConfig/.test(out)) out = `import { defineConfig } from 'vite'\n` + out;
  out += `\n// Added by create-super-react\nexport default defineConfig({ plugins: [tailwindcss()] })\n`;
  return out;
}

/** Add Vite dev proxy to /api → http://localhost:3000 (used when auth enabled) */
function addProxyToViteConfig(src) {
  if (/server\s*:\s*\{[\s\S]*proxy\s*:/.test(src)) return src;
  let out = src;
  const defineRe = /defineConfig\(\s*\{([\s\S]*?)\}\s*\)/m;
  if (defineRe.test(out)) {
    return out.replace(defineRe, (m, inner) => {
      if (/server\s*:\s*\{/.test(inner)) {
        return m.replace(/server\s*:\s*\{([\s\S]*?)\}/m, (sm, sInner) => {
          if (/proxy\s*:/.test(sInner)) return sm;
          const injected = `proxy: { '/api': 'http://localhost:3000' },`;
          return `server: { ${injected}\n${sInner} }`;
        });
      }
      return `defineConfig({\n  server: { proxy: { '/api': 'http://localhost:3000' } },\n${inner}\n})`;
    });
  }
  if (!/defineConfig/.test(out)) out = `import { defineConfig } from 'vite'\n` + out;
  out += `\n// Added by create-super-react\nexport default defineConfig({ server: { proxy: { '/api': 'http://localhost:3000' } } })\n`;
  return out;
}

async function writeBackendEnvExample(backendDir) {
  const env = `# Google OAuth credentials (required for auth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend origin for CORS and OAuth redirect
FRONTEND_ORIGIN=http://localhost:5173

# OAuth redirect URI (must match Google Console)
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
`;
  await fs.writeFile(path.join(backendDir, ".env.example"), env);
}

// Watch templates and sync to generated app
async function watchTemplates(templateRoot, projectRoot, withAuth, withPasswordAuth) {
  const { watch } = await import('chokidar');
  
  log("\n👁️  Watching template files for changes...");
  
  const watcher = watch(templateRoot, {
    persistent: true,
    ignoreInitial: true
  });
  
  watcher.on('change', async (templatePath) => {
    // Figure out which layer this file belongs to
    const relativePath = path.relative(templateRoot, templatePath);
    const parts = relativePath.split(path.sep);
    const layer = parts[0];
    
    // Skip if not a relevant layer
    if (layer === 'CLAUDE.md.templates') return;
    if (layer === 'auth-google' && !withAuth) return;
    if (layer === 'auth-password' && !withPasswordAuth) return;
    
    // Calculate destination path
    const layerRelativePath = parts.slice(1).join(path.sep);
    const destPath = path.join(projectRoot, layerRelativePath);
    
    try {
      // Copy the changed file
      const content = await fs.readFile(templatePath, 'utf8');
      await fs.writeFile(destPath, content);
      log(`✅ Updated: ${layerRelativePath}`);
    } catch (err) {
      log(`❌ Failed to update ${layerRelativePath}: ${err.message}`);
    }
  });
  
  // Keep the process running
  process.on('SIGINT', () => {
    watcher.close();
    process.exit(0);
  });
}

// ------------------------------ CLI FLAGS ------------------------------------
const args = process.argv.slice(2);
let projectPath = args.find((a) => !a.startsWith("--"));

// Check for non-interactive mode (flags provided)
const hasAuthFlag = args.includes("--no-auth") || args.includes("--minimal") || args.includes("--password-auth");
const livePreview = args.includes("--live-preview");

// ============================= MAIN LOGIC =====================================
async function main() {
  log("🚀 create-super-react");
  
  let withAuth, withPasswordAuth;
  
  // Interactive mode if no auth flags provided
  if (!hasAuthFlag) {
    const authChoice = await select(
      "Which authentication setup would you like?",
      [
        {
          value: "google",
          label: "Google OAuth only (Recommended)",
          hint: "Secure authentication with Google, no password management needed"
        },
        {
          value: "password",
          label: "Google OAuth + Email/Password",
          hint: "Full authentication with both Google and traditional email/password"
        },
        {
          value: "none",
          label: "No authentication",
          hint: "Simple app with navigation but no auth (great for demos)"
        }
      ]
    );
    
    withAuth = authChoice !== "none";
    withPasswordAuth = authChoice === "password";
  } else {
    // Use flags for non-interactive mode
    withAuth = !args.includes("--no-auth") && !args.includes("--minimal");
    withPasswordAuth = args.includes("--password-auth");
  }

  // Ensure tools
  await ensureTool("git", "--version", "Install Git from https://git-scm.com");
  await ensureTool("node", "--version", "Install Node.js from https://nodejs.org");
  await ensureTool("npm", "--version", "npm should come with Node.js");
  await ensureTool("bun", "--version", "Install Bun from https://bun.sh");

  // Get project path
  if (!projectPath && !hasAuthFlag) {
    // Interactive mode - ask for project name
    projectPath = await textInput("Project name", "my-app");
  } else if (!projectPath) {
    projectPath = ".";
  }
  const root = path.resolve(projectPath);
  const projectName = path.basename(root);

  // Create/check directory
  if (projectPath !== ".") {
    if (await exists(root)) {
      console.error(`❌ Directory "${root}" already exists`);
      process.exit(1);
    }
    await fs.mkdir(root, { recursive: true });
  } else {
    const empty = await dirIsEmpty(root);
    if (!empty) {
      console.error("❌ Current directory is not empty");
      process.exit(1);
    }
  }

  log(`📁 Creating project in ${root}`);

  // -------- FRONTEND --------
  const frontend = path.join(root, "frontend");
  log("\n🎨 Scaffolding frontend with Vite + React + TypeScript + Tailwind...");
  
  run(`npm create vite@latest frontend -- --template react-ts -y`, { cwd: root });
  run(`npm i`, { cwd: frontend });
  run(`npm i -D tailwindcss @tailwindcss/vite`, { cwd: frontend });

  // Apply base template (frontend only for now)
  const templateVars = {
    PROJECT_NAME: projectName,
    FRONTEND_DIR: "frontend",
    BACKEND_DIR: "backend"
  };
  
  await applyTemplateLayer("base", root, templateVars, { skipBackend: true });

  // Strip default App.css
  const appCssPath = path.join(frontend, "src", "App.css");
  if (await exists(appCssPath)) {
    await fs.unlink(appCssPath);
  }

  // Always install React Router since base template now uses it
  log("🧭 Adding React Router for navigation...");
  run(`npm i react-router-dom`, { cwd: frontend });

  if (withAuth) {
    if (withPasswordAuth) {
      log("🔐 Adding auth pages + CSRF helper + password forms...");
      run(`npm i lucide-react`, { cwd: frontend });
      await applyTemplateLayer("auth-password", root, templateVars, { skipBackend: true });
    } else {
      log("🔐 Adding Google OAuth auth...");
      await applyTemplateLayer("auth-google", root, templateVars, { skipBackend: true });
    }
  }

  // -------- BACKEND --------
  log("📦 Scaffolding backend with Bun + Hono...");
  const backend = path.join(root, "backend");
  
  // First create backend with Hono
  let ok = tryRun(`bunx --yes create-hono@latest backend --template bun --install --pm bun`, { cwd: root });
  if (!ok) {
    console.warn("bun create failed; falling back to npm create hono...");
    run(`npm create hono@latest backend -- --template bun --install --pm bun -y`, { cwd: root });
  }

  // Then apply backend templates (overwrites Hono's index.ts)
  await applyTemplateLayer("base", root, templateVars, { skipFrontend: true });
  
  if (withAuth) {
    if (withPasswordAuth) {
      log("🔐 Installing backend deps (zod) and writing auth server with CSRF + Google OAuth + Password auth...");
      run(`bun add zod`, { cwd: backend });
      await applyTemplateLayer("auth-password", root, templateVars, { skipFrontend: true });
    } else {
      log("🔐 Writing Google OAuth only auth server...");
      await applyTemplateLayer("auth-google", root, templateVars, { skipFrontend: true });
    }
    await writeBackendEnvExample(backend);
  }

  try { await fs.appendFile(path.join(backend, ".gitignore"), `\n# SQLite database\n/data.sqlite\n`); } catch {}

  // -------- TAILWIND CONFIG --------
  const viteCfgPath = await findFile(frontend, ["vite.config.ts", "vite.config.js"]);
  if (viteCfgPath) {
    let cfg = await fs.readFile(viteCfgPath, "utf8");
    cfg = addTailwindToViteConfig(cfg);
    if (withAuth) cfg = addProxyToViteConfig(cfg);
    await fs.writeFile(viteCfgPath, cfg);
  } else {
    log("⚠️  Could not find a Vite config to patch. Please add Tailwind (and proxy if using auth) manually.");
  }

  // -------- CLAUDE.md --------
  const claudeMdContent = await getClaudeMdContent(projectName, withAuth, withPasswordAuth);
  await fs.writeFile(path.join(root, "CLAUDE.md"), claudeMdContent);

  // -------- LIVE PREVIEW MODE --------
  if (livePreview) {
    log("\n🔗 Setting up live preview mode (file watching)...");
    
    const templateRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "templates");
    
    // Start watching in the background
    setImmediate(() => {
      watchTemplates(templateRoot, root, withAuth, withPasswordAuth);
    });
    
    log("✅ Live preview mode enabled! Edit template files to see changes in the generated app.");
    log("   Press Ctrl+C to stop watching.");
  }

  // -------- GIT INIT --------
  const inGitRepo = await exists(path.join(root, ".git"));
  if (!inGitRepo) {
    log("\n📝 Initializing git repo...");
    run(`git init`, { cwd: root });
    try { run(`git add -A`, { cwd: root }); } catch {}
    try { run(`git commit -m "Initial commit from create-super-react"`, { cwd: root }); } catch {}
  }

  // -------- DONE --------
  if (!livePreview) {
    log("\n✅ Done! Your full-stack app is ready.");
  }
  log("\n🏃 To start developing:");
  if (projectPath !== ".") log(`   cd ${projectPath}`);
  log("   # Terminal 1 - Backend:");
  log("   cd backend && bun run dev");
  log("\n   # Terminal 2 - Frontend:");
  log("   cd frontend && npm run dev");
  if (withAuth) {
    log("\n🔐 Auth setup: Copy backend/.env.example to backend/.env and add Google OAuth credentials");
  }
  
  // Close prompts interface
  closePrompts();
  
  // If in live preview mode, keep the process running
  if (livePreview) {
    // The process will keep running due to the file watcher
  }
}

main().catch((e) => {
  console.error("Error:", e);
  closePrompts();
  process.exit(1);
});