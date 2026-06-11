# ClipLoop Split Architecture

## Overview

ClipLoop runs a **two-surface architecture** inside a single monorepo:

| Surface | Directory | Stack | Purpose |
|---------|-----------|-------|---------|
| **Public Marketing Site** | `cliploop-vite/` | Vite + React + Tailwind + Framer Motion | Landing, pricing, sign-in, request access, terms, privacy |
| **Product App / API / Backend** | `src/`, `auth.ts`, `next.config.ts`, `migrations/` | Next.js App Router + TypeScript + Postgres + Drizzle | Dashboard, generation, rendering, publishing, billing, auth, API |

The two surfaces share the same GitHub repository (`talocode/cliploop`) but have separate build pipelines, dependencies, environment variables, and deployment targets.

---

## Two-Surface Architecture

### 1. `cliploop-vite/` — Public Marketing Frontend

**Stack:** Vite 6 + React 19 + TailwindCSS + Framer Motion  
**Package manager:** npm  
**Entry point:** `index.html` → `src/main.tsx` → `src/App.tsx`

**Responsibility:**
- Serve public-facing marketing pages (landing, pricing, sign-in, etc.)
- Animated, pixel-perfect marketing UI with dark theme
- Router-level page transitions via Framer Motion
- SPA routing handled via `public/_redirects` (`/* /index.html 200`)

**Pages:**
- `/` — Landing page with animated hero, features, CTA
- `/pricing` — Pricing tiers
- `/request-access` — Beta access request
- `/signin` — Sign-in (redirects to Next.js backend for OAuth)
- `/privacy`, `/terms`, `/support` — Legal/info pages
- `/app/*` — App shell + dashboard sub-routes (DashboardHome, Create, Projects, Chats, ApiKeys)

**Auth flow:**
- User clicks sign-in on Vite frontend
- Redirects to Next.js backend (`cliploop.site`) for Google OAuth
- Next.js handles the OAuth callback and session management
- Vite frontend proxies `/api/*` to the Next.js backend

### 2. Next.js `src/app/` — Product App / Backend / API

**Stack:** Next.js 15 App Router + TypeScript + TailwindCSS  
**Package manager:** npm  
**Entry point:** `next dev` / `next start`

**Responsibility:**
- Authenticated product dashboard (`/app`, `/dashboard/*`)
- All API routes (`/api/*`)
  - Generation, rendering, publishing, tracking, billing
  - Project, strategy, content-item, iteration CRUD
  - Instagram channel connection and publish
  - Credit ledger and billing policy enforcement
  - Job queue and worker endpoints
- Auth (NextAuth.js with Google OAuth)
- Database access (Drizzle ORM + Postgres)
- Server-side orchestration (LLM calls, render pipeline, publish pipeline)
- Background jobs and scheduled tasks

**Key backend modules:**
- `src/app/` — Route handlers and pages
- `src/lib/` — Shared utilities (auth, DB, prompts, render adapters)
- `src/domains/` — Domain services (projects, strategy, content-items, rendering, publishing, metrics, iterations, credits)
- `src/core/` — Open-core reusable contracts (LLM providers, render contracts, billing policy, context ingestion)
- `src/gateway/` — Hosted gateway interface (future API-key platform)
- `src/tests/` — Integration tests (e.g., billing idempotency)
- `migrations/` — Drizzle SQL migrations
- `scripts/` — Seed scripts

---

## Deployment Mapping

| Domain | Surface | Host | Deployment Method |
|--------|---------|------|-------------------|
| `cliploop.site` | Vite marketing frontend | Render (static site) | Auto-deploy from `main` branch, `cliploop-vite/` rootDir |
| `www.cliploop.site` | Vite marketing frontend (or redirect) | Render (static site) | Same as above — CNAME alias |
| `app.cliploop.site` | Next.js product app/backend/API | Render (web service) | Auto-deploy from `main` branch |

### Current live URLs:
- **Vite frontend (target):** `cliploop.site` / `www.cliploop.site`
- **Next.js backend (target):** `app.cliploop.site`
- **Render raw URLs:** `cliploop-app.onrender.com` (Vite static site), `cliploop.site` (Next.js web service)

### Vite → Next.js proxy:
In development, `vite.config.ts` proxies `/api/*` requests to `https://app.cliploop.site` (the Next.js production backend). In production, the Vite frontend's SignInPage also uses this domain for OAuth redirects. This keeps auth and API calls working without the Vite frontend ever handling secrets.

### SPA routing:
The Vite frontend uses a `public/_redirects` file (`/* /index.html 200`) so Render serves `index.html` for all non-file routes. This enables direct URL access (e.g., `/pricing`, `/app`) in the SPA without 404 errors.

---

## Styling Rules

### Marketing site (`cliploop.site`)
- **Strict Talocode dark/white design**
- Background: `#050505`, surfaces: `#0E0E0E`, borders: `#1F1F1F`
- Text: white primary, `#A3A3A3` secondary, `#8B8B8B` muted
- No light mode CSS — all styles are unconditional dark
- Framer Motion animations for page transitions, staggered reveals, hover effects
- Marketing-focussed: bold CTAs, testimonials, feature cards, pricing tables

### Product app (`app.cliploop.site`)
- Same dark/white base palette as marketing site
- **Green (`#22C55E`) used only for functional states:**
  - Success indicators
  - Active/online status
  - Confirmed/completed actions
  - Never for decorative or branding purposes
- Clean, dashboard-optimized layout
- Restrained spacing, minimal visual noise

---

## Development Commands

### Vite Frontend (`cliploop-vite/`)

```bash
# Start dev server (with proxy to Next.js backend)
cd cliploop-vite && npm run dev
# Opens at http://localhost:5173

# Build for production
cd cliploop-vite && npm run build
# Output: cliploop-vite/dist/

# Preview production build
cd cliploop-vite && npm run preview
```

### Next.js App/Backend (`./`)

```bash
# Start dev server
npm run dev
# Opens at http://localhost:3000

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Database migrations
npm run db:migrate

# Run billing integration tests
npm run test:billing

# Seed database
npm run db:seed
```

### Full local development (both surfaces)

For full-stack local dev, you typically run both:

1. **Terminal 1** — Next.js backend at `localhost:3000`
2. **Terminal 2** — Vite frontend at `localhost:5173` (proxies `/api` to `localhost:3000`)

Or, if you don't need the marketing site locally, just run the Next.js dev server and access it directly at `localhost:3000` (the Next.js app also serves the marketing routes from its App Router).

---

## Environment Boundaries

### Vite frontend (`cliploop-vite/.env`)
- **Must only contain public env vars** (prefix with `VITE_`)
- Example: `VITE_API_URL` (the Next.js backend URL)
- **No secrets** — no API keys, DB credentials, or auth tokens
- All sensitive operations go through the Next.js backend proxy (`/api/*`)

### Next.js backend (`./.env`)
- Owns all secrets:
  - `DATABASE_URL` — Postgres connection string
  - `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Auth secrets
  - `MISTRAL_API_KEY`, `LLM_PROVIDER` — LLM provider config
  - `ENCRYPTION_SECRET` — Instagram token encryption
  - `HYPERFRAMES_BIN`, `HYPERFRAMES_ENABLED` — Render engine config
  - `MOCK_LLM`, `MOCK_MODE` — Dev/test flags
- Owns database access, auth logic, billing, and generation

---

## What Must NOT Live in `cliploop-vite/`

| Item | Reason |
|------|--------|
| API keys / secrets | Vite builds are client-side; all env vars with `VITE_` prefix are embedded in the bundle |
| Database access | The Vite frontend has no DB connection, no Drizzle, no query logic |
| Auth logic | No OAuth flows, no session handling, no token storage beyond the cookie/session set by Next.js backend |
| Paid API / generation logic | No LLM calls, no render pipeline, no billing enforcement |
| Business domain logic | No domain services, no credit management, no strategy generation |

All of these belong exclusively in the Next.js backend.

---

## Migration Notes

This repo started as a pure Next.js application. The marketing frontend was extracted into `cliploop-vite/` to:
1. Enable Framer Motion animations and SPA architecture without fighting Next.js SSR
2. Separate the marketing surface from the authenticated product surface
3. Allow independent builds and deployments for each surface
4. Reduce cold-start latency on the marketing pages

The Next.js backend at root still serves the same routes (`/`, `/pricing`) alongside the app routes — the Vite frontend replaces it as the primary marketing surface. The existing `ARCHITECTURE.md` at repo root documents the internal domain layer and open-core extraction, which remains accurate for the Next.js backend.

---

## Video pipeline architecture

ClipLoop's promo video engine pipeline (ingest → plan → EDL → render → self-eval → publish → learn) is documented separately:

- **[VIDEO_PIPELINE_ARCHITECTURE.md](./VIDEO_PIPELINE_ARCHITECTURE.md)** — structured perception pattern adapted from [video-use](https://github.com/browser-use/video-use)
- Research notes live in LaunchPix: `docs/research/VIDEO_USE_ARCHITECTURE_NOTES.md`

---

## TODO (Dev)

- [ ] Remove `typescript.ignoreBuildErrors: true` from `next.config.ts` after all remaining TypeScript errors are fixed
