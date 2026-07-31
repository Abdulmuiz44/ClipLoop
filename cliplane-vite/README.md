# ClipLane — Vite Frontend

Client-side app for ClipLane, paired with the existing Next.js API backend.

## Architecture

```
cliplane-vite/         ← this project (Vite + React)
cliplane/              ← existing Next.js project (API backend)
```

- **Frontend:** Vite + React 19 + TypeScript + Tailwind + Framer Motion
- **API Backend target:** `https://api.talocode.site/v1/cliplane` (auth, DB, and billing remain backend responsibilities)

## Getting Started

```bash
npm install
npm run dev
```

Dev server runs at `http://localhost:5173`. The Vite proxy forwards `/api/*` to the target `https://api.talocode.site/v1/cliplane` API.

## Auth Flow

1. User clicks "Continue with Google"
2. Redirected through the target Talocode API: `https://api.talocode.site/v1/cliplane/auth/signin`
3. Google OAuth redirects back to the Vite app (via `callbackUrl`)
4. The Vite app reads session by calling `GET /api/auth/session`

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/pricing` | Pricing & plans |
| `/signin` | Google sign-in |
| `/app` | Dashboard (auth required) |
| `/app/create` | Content creation |
| `/app/projects` | Project management |
| `/app/chats` | Chat workspace |
| `/app/weekly-promo` | Templates |
| `/app/settings/api-keys` | Developer API keys |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |
| `/support` | Support |
| `/request-access` | Beta access request |

## Deploy to Render (Static Site)

1. **Create a new Static Site** on Render
2. **Connect your repo** (set root to `cliplane-vite/`)
3. **Build command:** `npm ci && npm run build`
4. **Publish directory:** `dist`
5. **Optional:** Set `NODE_VERSION` env to `24`

**Important:** After deploying, update `SignInPage.tsx` if the API URL changes:

```ts
const API_BASE = "https://api.talocode.site/v1/cliplane";
```

The Vite app must be served from a domain that:
- The user visits the [ClipLane landing page](https://talocode.site/products/cliplane) or [dashboard](https://dashboard.talocode.site/products/cliplane)

The Talocode URLs above describe the target architecture and do not indicate deployment status.
- Has the Next.js backend available at `/api` (dev) or a separate domain (production)
