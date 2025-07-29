# Template Structure Design

## Directory Layout
```
templates/
├── base/                    # Common files for all presets
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── backend/
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── auth-google/            # Google OAuth only additions
│   ├── frontend/
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Login.tsx
│   │       │   ├── Dashboard.tsx
│   │       │   └── Settings.tsx
│   │       ├── contexts/
│   │       │   └── auth.tsx
│   │       └── http.ts
│   └── backend/
│       ├── src/
│       │   └── index.ts
│       └── .env.example
├── auth-password/          # Password + Google auth additions
│   ├── frontend/
│   │   └── src/
│   │       └── pages/
│   │           ├── Login.tsx
│   │           ├── Signup.tsx
│   │           └── Settings.tsx
│   └── backend/
│       └── src/
│           └── index.ts
└── CLAUDE.md.templates/    # CLAUDE.md templates
    ├── base.md
    ├── auth-google.md
    └── auth-password.md
```

## Template Variables
Templates will support variable substitution:
- `{{PROJECT_NAME}}` - Project directory name
- `{{FRONTEND_DIR}}` - Frontend directory path
- `{{BACKEND_DIR}}` - Backend directory path