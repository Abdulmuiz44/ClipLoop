# ClipLoop — Vite Frontend

Client-side app for ClipLoop, paired with the existing Next.js API backend.

## Architecture

```
cliploop-vite/         ← this project (Vite + React)
cliploop/              ← existing Next.js project (API backend)
```

- **Frontend:** Vite + React 19 + TypeScript + Tailwind + Framer Motion
- **API Backend:** Existing Next.js app at `www.cliploop.site` (handles auth, DB, billing)

## Getting Started

```bash
npm install
npm run dev
```

Dev server runs at `http://localhost:5173`. The Vite proxy forwards `/api/*` to `https://www.cliploop.site`.

## Auth Flow

1. User clicks "Continue with Google"
2. Redirected to Next.js backend: `www.cliploop.site/api/auth/signin`
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
2. **Connect your repo** (set root to `cliploop-vite/`)
3. **Build command:** `npm ci && npm run build`
4. **Publish directory:** `dist`
5. **Optional:** Set `NODE_VERSION` env to `24`

**Important:** After deploying, update `SignInPage.tsx` if the API URL changes:

```ts
const API_BASE = "https://www.cliploop.site/api"; // update this
```

The Vite app must be served from a domain that:
- The user visits directly (e.g., `app.cliploop.site` or `www.cliploop.site`)
- Has the Next.js backend available at `/api` (dev) or a separate domain (production)
