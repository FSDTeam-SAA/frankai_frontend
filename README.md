# FrankAI – Electrical Take-off App

A Next.js 15 application for AI-powered electrical symbol detection and take-off management. Built with React 19, Tailwind CSS v4, shadcn/ui, and a dark industrial theme.

---

## Tech Stack

| Layer        | Technology                              |
|-------------|------------------------------------------|
| Framework   | Next.js 15 (App Router)                  |
| Language    | TypeScript 5                             |
| UI Library  | React 19                                 |
| Styling     | Tailwind CSS v4 + shadcn/ui components   |
| State       | In-memory mock store (`lib/store.ts`)    |
| Package Mgr | pnpm (recommended) or npm                |

> **Note:** This version uses mock/static data only — no real backend or API keys are needed.

---

## Prerequisites

Make sure you have these installed before starting:

| Tool    | Version  | Install link                              |
|---------|----------|-------------------------------------------|
| Node.js | ≥ 18.x   | https://nodejs.org                        |
| pnpm    | ≥ 8.x    | `npm install -g pnpm`                     |
| Git     | any      | https://git-scm.com                       |

Check your versions:
```bash
node -v
pnpm -v
```

---

## Quick Start

### 1. Extract the project

Unzip `frankai-main.zip` to your desired directory:
```bash
unzip frankai-main.zip
cd frankai-main
```

### 2. Install dependencies

```bash
pnpm install
```

If you prefer npm:
```bash
npm install
```

### 3. Set up environment (optional)

```bash
cp .env.example .env.local
```
No values need to be filled in — the project runs entirely on mock data.

### 4. Start the dev server

```bash
pnpm dev
```

Or with npm:
```bash
npm run dev
```

### 5. Open in browser

```
http://localhost:3000
```

---

## App Routes & Pages

| URL                        | Page                          | Description                                     |
|---------------------------|-------------------------------|--------------------------------------------------|
| `/`                       | Root redirect                 | Redirects to `/login`                            |
| `/login`                  | Login                         | Enter any email + password (simulated auth)      |
| `/forgot-password`        | Forgot Password               | Password reset UI (no email actually sent)       |
| `/dashboard`              | Dashboard                     | Project overview, stats, recent activity         |
| `/projects`               | Project List                  | All electrical take-off projects                 |
| `/projects/[id]`          | Project Detail                | Symbol detection view, mapping, export           |
| `/new-takeoff`            | New Take-off Wizard           | Multi-step upload + configuration wizard         |
| `/admin`                  | Admin Panel                   | User management, billing, audit logs             |

### Login Credentials
Since this is a mock app, **any email and password** will work.  
Just type anything in the form and click **Sign In**.

---

## Project Structure

```
frankai-main/
├── app/                        # Next.js App Router
│   ├── (app)/                  # Authenticated layout group
│   │   ├── admin/page.tsx      # Admin dashboard
│   │   ├── dashboard/page.tsx  # Main dashboard
│   │   ├── new-takeoff/page.tsx # Upload wizard
│   │   └── projects/
│   │       ├── page.tsx        # Project list
│   │       └── [id]/page.tsx   # Project detail
│   ├── login/page.tsx          # Login page
│   ├── forgot-password/page.tsx
│   ├── globals.css             # Global styles + CSS variables (dark theme)
│   └── layout.tsx              # Root layout
│
├── components/
│   ├── nav/main-nav.tsx        # Top navigation bar
│   ├── plan/
│   │   └── electrical-plan-view.tsx  # PDF/plan canvas viewer
│   ├── wizard/
│   │   └── wizard-progress.tsx # Multi-step wizard progress bar
│   └── ui/                     # shadcn/ui base components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── select.tsx
│       ├── table.tsx
│       └── ... (16 total)
│
├── lib/
│   ├── store.ts                # All mock data (projects, symbols, mappings)
│   └── utils.ts                # cn() utility helper
│
├── public/                     # Static assets (icons, placeholder images)
├── next.config.mjs             # Next.js config (TS errors ignored for build)
├── postcss.config.mjs          # PostCSS + Tailwind v4 config
├── components.json             # shadcn/ui config
├── tsconfig.json               # TypeScript config
└── package.json
```

---

## Available Scripts

| Command         | What it does                                         |
|----------------|------------------------------------------------------|
| `pnpm dev`     | Start dev server on http://localhost:3000            |
| `pnpm build`   | Build for production (outputs to `.next/`)           |
| `pnpm start`   | Run production build (run `build` first)             |
| `pnpm lint`    | Run ESLint checks                                    |

---

## Production Build

```bash
# Build
pnpm build

# Start production server
pnpm start
```

Open http://localhost:3000

---

## Mock Data & Store

All application data lives in `lib/store.ts`. It includes:

- **`mockProject`** — a single project with full electrical symbol data
- **`mockProjects`** — an array of multiple projects for the project list
- **`DetectedSymbol`** — symbol types: `light`, `gpo`, `fan`, `data`, `exit`, `emergency`, `switch`, `downlight`
- **`MappingRow`** — product code mappings per symbol type

To add/change mock projects or symbols, edit `lib/store.ts` directly.

---

## Adding a Real Backend (Future)

When you're ready to connect real APIs:

1. Create API routes in `app/api/` (e.g. `app/api/projects/route.ts`)
2. Replace mock data calls in page components with `fetch()` calls
3. Add auth (e.g. NextAuth.js, Supabase Auth, Clerk)
4. Set real env vars in `.env.local`

Example API route structure:
```ts
// app/api/projects/route.ts
export async function GET() {
  const projects = await db.projects.findMany()
  return Response.json(projects)
}
```

---

## Common Issues

### Port already in use
```bash
pnpm dev -- --port 3001
```

### pnpm not found
```bash
npm install -g pnpm
```

### Build errors (TypeScript)
TypeScript errors are intentionally ignored during build (see `next.config.mjs`).  
For dev, they'll show as warnings only — the app still runs.

### Tailwind styles not loading
Make sure PostCSS config exists at root and you're running `pnpm dev` (not a static server). Tailwind v4 requires the build pipeline.

---

## Browser Support

Modern browsers only (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+).  
Uses `oklch()` CSS color space — not supported in IE or very old browsers.

---

## License

Private project. Not licensed for redistribution.
