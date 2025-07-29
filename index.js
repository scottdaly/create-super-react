#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { applyTemplateLayer, getClaudeMdContent, setProgressCallback } from "./lib/templates.js";

const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });
const tryRun = (cmd, opts = {}) => {
  try { execSync(cmd, { stdio: "inherit", ...opts }); return true; }
  catch { return false; }
};

// ----------------------------- helpers -------------------------------------

async function ensureTool(cmd, versionArg = "--version", hint = "") {
  try { execSync(`${cmd} ${versionArg}`, { stdio: "ignore" }); }
  catch { 
    p.cancel(`Missing tool: ${cmd}. ${hint}`);
    process.exit(1);
  }
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

// ------------------------------ CLI FLAGS ------------------------------------
const args = process.argv.slice(2);
let projectPath = args.find((a) => !a.startsWith("--"));

// Check for non-interactive mode (flags provided)
const hasAuthFlag = args.includes("--no-auth") || args.includes("--minimal") || args.includes("--password-auth");
const livePreview = args.includes("--live-preview");

// ============================= MAIN LOGIC =====================================
async function main() {
  console.log();
  
  // ASCII art logo with elegant gradient
  console.log();
  
  // Helper to create RGB color
  const rgb = (r, g, b) => (text) => `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
  
  // Create a smooth gradient from peach to rose to purple
  const gradient = [
    { bolt: rgb(253, 206, 176), text: rgb(253, 206, 176) },  // Top: Peach
    { bolt: rgb(248, 195, 171), text: rgb(248, 195, 171) },  // Peach transition
    { bolt: rgb(242, 185, 166), text: rgb(242, 185, 166) },  // Peach to rose
    { bolt: rgb(237, 175, 162), text: rgb(237, 175, 162) },  // Light rose
    { bolt: rgb(232, 165, 160), text: rgb(232, 165, 160) },  // Rose approaching middle
    { bolt: rgb(222, 155, 159), text: rgb(222, 155, 159) },  // Middle: Rose
    { bolt: rgb(195, 135, 150), text: rgb(195, 135, 150) },  // Rose to purple
    { bolt: rgb(168, 116, 141), text: rgb(168, 116, 141) },  // Purple-rose
    { bolt: rgb(141, 96, 132), text: rgb(141, 96, 132) },   // Light purple
    { bolt: rgb(114, 87, 127), text: rgb(114, 87, 127) },   // Purple approaching bottom
    { bolt: rgb(88, 77, 123), text: rgb(88, 77, 123) }      // Bottom: Purple
  ];
  
  const lines = [
    ['       ▄███████████▀    ', '▄█████ ██  ██ █████▄ ██████ █████▄'],
    ['      ▄██████████▀      ', '██     ██  ██ ██  ██ ██     ██  ██'],
    ['     ▄█████████▀        ', '██████ ██  ██ █████▀ ████   █████▄'],
    ['    ▄████████▀          ', '    ██ ██  ██ ██     ██     ██  ██'],
    ['   ▄█████████████▀      ', '█████▀ ██████ ██     ██████ ██  ██'],
    ['  ▄████████████▀        ', ''],
    ['      ▄██████▀          ', '█████▄ ██████ ▄████▄  ▄████ ██████'],
    ['     ▄█████▀            ', '██  ██ ██     ██  ██ ██       ██'],
    ['    ▄████▀              ', '█████▄ ████   ██▄▄██ ██       ██'],
    ['   ▄███▀                ', '██  ██ ██     ██  ██ ██       ██'],
    ['  ▄█▀                   ', '██  ██ ██████ ██  ██  ▀████   ██']
  ];
  
  // Display with subtle animation
  lines.forEach((line, index) => {
    const color = gradient[index];
    const boltText = color.bolt(line[0]);
    const titleText = line[1] ? '\x1b[1m' + color.text(line[1]) + '\x1b[0m' : '';
    console.log(boltText + titleText);
  });
  
  console.log();
  console.log(pc.dim('         Full-stack starter with Vite + TypeScript + Auth'));
  console.log();
  
  p.intro(pc.cyan('Welcome to create-super-react'));
  
  let withAuth, withPasswordAuth;
  
  // Interactive mode if no auth flags provided
  if (!hasAuthFlag) {
    // Get project name if not provided
    if (!projectPath) {
      projectPath = await p.text({
        message: 'Project name:',
        placeholder: 'my-app',
        defaultValue: 'my-app',
        validate(value) {
          if (!value) return 'Project name is required';
          if (!/^[a-z0-9-]+$/.test(value)) {
            return 'Project name can only contain lowercase letters, numbers, and hyphens';
          }
        }
      });
      
      if (p.isCancel(projectPath)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
    }
    
    const authChoice = await p.select({
      message: 'Select authentication:',
      options: [
        {
          value: 'google',
          label: 'Google OAuth only',
          hint: 'Secure authentication with Google, no password management'
        },
        {
          value: 'password',
          label: 'Google OAuth + Email/Password',
          hint: 'Full authentication with both Google and traditional email/password'
        },
        {
          value: 'none',
          label: 'No authentication',
          hint: 'Simple app with navigation but no auth (great for demos)'
        }
      ],
    });
    
    if (p.isCancel(authChoice)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
    
    withAuth = authChoice !== 'none';
    withPasswordAuth = authChoice === 'password';
  } else {
    // Use flags for non-interactive mode
    withAuth = !args.includes("--no-auth") && !args.includes("--minimal");
    withPasswordAuth = args.includes("--password-auth");
  }

  const s = p.spinner();
  
  // Ensure tools
  s.start('Checking prerequisites');
  await ensureTool("git", "--version", "Install Git from https://git-scm.com");
  await ensureTool("node", "--version", "Install Node.js from https://nodejs.org");
  await ensureTool("npm", "--version", "npm should come with Node.js");
  await ensureTool("bun", "--version", "Install Bun from https://bun.sh");
  s.stop('Prerequisites checked');

  // Get project path
  if (!projectPath) {
    projectPath = ".";
  }
  const root = path.resolve(projectPath);
  const projectName = path.basename(root);

  // Create/check directory
  if (projectPath !== ".") {
    if (await exists(root)) {
      p.cancel(`Directory "${root}" already exists`);
      process.exit(1);
    }
    await fs.mkdir(root, { recursive: true });
  } else {
    const empty = await dirIsEmpty(root);
    if (!empty) {
      p.cancel("Current directory is not empty");
      process.exit(1);
    }
  }

  p.log.info(`Creating project in ${pc.cyan(root)}`);

  // -------- FRONTEND --------
  const frontend = path.join(root, "frontend");
  s.start('Creating frontend with Vite + React + TypeScript');
  
  run(`npm create vite@latest frontend -- --template react-ts -y`, { cwd: root });
  run(`npm i`, { cwd: frontend });
  
  s.message('Installing Tailwind CSS v4');
  run(`npm i -D tailwindcss @tailwindcss/vite`, { cwd: frontend });

  // Apply base template (frontend only for now)
  const templateVars = {
    PROJECT_NAME: projectName,
    FRONTEND_DIR: "frontend",
    BACKEND_DIR: "backend"
  };
  
  // Set up progress tracking for template operations
  setProgressCallback((current, total, filename) => {
    const percentage = Math.round((current / total) * 100);
    s.message(`Copying templates [${percentage}%] ${filename}`);
  });
  
  await applyTemplateLayer("base", root, templateVars, { skipBackend: true, showProgress: true });

  // Strip default App.css
  const appCssPath = path.join(frontend, "src", "App.css");
  if (await exists(appCssPath)) {
    await fs.unlink(appCssPath);
  }

  // Always install React Router since base template now uses it
  s.message('Adding React Router');
  run(`npm i react-router-dom`, { cwd: frontend });

  if (withAuth) {
    if (withPasswordAuth) {
      s.message('Adding authentication with password support');
      run(`npm i lucide-react`, { cwd: frontend });
      await applyTemplateLayer("auth-password", root, templateVars, { skipBackend: true, showProgress: true });
    } else {
      s.message('Adding Google OAuth authentication');
      await applyTemplateLayer("auth-google", root, templateVars, { skipBackend: true, showProgress: true });
    }
  }

  // -------- BACKEND --------
  s.message('Creating backend with Bun + Hono');
  const backend = path.join(root, "backend");
  
  // First create backend with Hono
  let ok = tryRun(`bunx --yes create-hono@latest backend --template bun --install --pm bun`, { cwd: root });
  if (!ok) {
    console.warn("bun create failed; falling back to npm create hono...");
    run(`npm create hono@latest backend -- --template bun --install --pm bun -y`, { cwd: root });
  }

  // Then apply backend templates (overwrites Hono's index.ts)
  await applyTemplateLayer("base", root, templateVars, { skipFrontend: true, showProgress: true });
  
  if (withAuth) {
    if (withPasswordAuth) {
      s.message('Setting up backend authentication');
      run(`bun add zod`, { cwd: backend });
      await applyTemplateLayer("auth-password", root, templateVars, { skipFrontend: true, showProgress: true });
    } else {
      await applyTemplateLayer("auth-google", root, templateVars, { skipFrontend: true, showProgress: true });
    }
    await writeBackendEnvExample(backend);
  }

  try { await fs.appendFile(path.join(backend, ".gitignore"), `\n# SQLite database\n/data.sqlite\n`); } catch {}

  // -------- TAILWIND CONFIG --------
  s.message('Configuring build tools');
  const viteCfgPath = await findFile(frontend, ["vite.config.ts", "vite.config.js"]);
  if (viteCfgPath) {
    let cfg = await fs.readFile(viteCfgPath, "utf8");
    cfg = addTailwindToViteConfig(cfg);
    if (withAuth) cfg = addProxyToViteConfig(cfg);
    await fs.writeFile(viteCfgPath, cfg);
  }

  // -------- CLAUDE.md --------
  const claudeMdContent = await getClaudeMdContent(projectName, withAuth, withPasswordAuth);
  await fs.writeFile(path.join(root, "CLAUDE.md"), claudeMdContent);

  // -------- GIT INIT --------
  const inGitRepo = await exists(path.join(root, ".git"));
  if (!inGitRepo) {
    s.message('Initializing git repository');
    run(`git init`, { cwd: root });
    try { run(`git add -A`, { cwd: root }); } catch {}
    try { run(`git commit -m "Initial commit from create-super-react"`, { cwd: root }); } catch {}
  }

  s.stop('Project created successfully!');

  // -------- DONE --------
  // Show created file structure
  const tree = [
    pc.cyan(projectName + '/'),
    '├── ' + pc.blue('frontend/') + ' ' + pc.dim('(Vite + React + TypeScript + Tailwind)'),
    '│   ├── src/',
    '│   │   ├── ' + (withAuth ? 'components/' : 'pages/'),
    '│   │   ├── ' + (withAuth ? 'contexts/' : 'App.tsx'),
    '│   │   └── ' + (withAuth ? 'pages/' : 'index.css'),
    '│   └── package.json',
    '├── ' + pc.green('backend/') + ' ' + pc.dim('(Bun + Hono + SQLite)'),
    '│   ├── index.ts',
    '│   ├── package.json',
    withAuth ? '│   └── .env.example' : '│   └── ' + pc.dim('(minimal API)'),
    '└── CLAUDE.md ' + pc.dim('(AI-friendly docs)')
  ].filter(Boolean);
  
  p.note(tree.join('\n'), 'Created files');
  
  p.note([
    `${pc.bold('Backend:')} cd backend && bun run dev`,
    `${pc.bold('Frontend:')} cd frontend && npm run dev`,
    '',
    withAuth ? `${pc.yellow('⚠')} Configure Google OAuth in backend/.env` : ''
  ].filter(Boolean).join('\n'), 'Start developing');

  p.outro(`${pc.green('✓')} Done!`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});