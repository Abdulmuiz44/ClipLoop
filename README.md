# ClipLoop

ClipLoop is a lean AI-powered growth automation tool for indie apps and small SaaS products.

## MVP slices currently implemented

- Week 1 generation loop (project → strategy → 5 drafts → single regeneration)
- Rendering loop (render one or all posts to local MP4 + thumbnail)
- Approval + scheduling + DB-backed publish queue (mock publisher)
- Tracked links + click logging + conversion/revenue ingestion + performance rollups
- Manual iteration engine (analyze winners/losers → generate next cycle)

## Tech stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Postgres
- Drizzle ORM
- Zod validation
- FFmpeg (system dependency for rendering)

## Local setup

1. Install dependencies
```bash
npm install
```

2. Configure env
```bash
cp .env.example .env
```

3. Ensure Postgres is running and `DATABASE_URL` is valid.

4. Run migrations
```bash
npm run db:migrate
```

5. Optional seed
```bash
npm run db:seed
```

6. Start app
```bash
npm run dev
```

Open `http://localhost:3000`.

## Rendering prerequisite: FFmpeg

- macOS (Homebrew): `brew install ffmpeg`
- Ubuntu/Debian: `sudo apt update && sudo apt install -y ffmpeg`
- Windows (winget): `winget install Gyan.FFmpeg`

If FFmpeg is missing, render APIs return a clear error.

## Publish workflow (real Instagram + mock fallback)

1. Generate posts for a weekly cycle.
2. Render each post (or render all).
3. Approve one post (or approve all).
4. Schedule publish times (single or bulk).
5. Run due jobs manually from the weekly page (`Run due jobs now`).
6. Items move through publish states and end at `published`.

Publishing mode selection:
- If a project has an active, valid Instagram channel, jobs use the real Instagram publisher.
- If no valid channel exists and `MOCK_MODE=true`, jobs fall back to mock publishing.
- If no valid channel exists and `MOCK_MODE=false`, jobs fail clearly with channel errors.

## Instagram channel connection

ClipLoop supports one real publishing channel per project in MVP: Instagram.

Minimum setup:
1. Set `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI`, and `ENCRYPTION_SECRET`.
2. In your Meta app config, add the callback URL:
   - `http://localhost:3000/api/integrations/instagram/callback` (local)
3. From the project page, click **Connect Instagram**.
4. After callback, the project page shows channel status (active/expired/invalid/disconnected).

Token safety:
- Access tokens are encrypted at rest using `ENCRYPTION_SECRET`.
- Tokens are decrypted only during publish/connect operations.

Local/dev testing:
- With no Instagram credentials and `MOCK_MODE=true`, the weekly loop still runs via mock publisher.
- To test real publish, connect a real Instagram channel and run due jobs from the weekly page.

## Tracked links and attribution

Each content item has a tracking slug and redirect link:
- `/r/<trackingSlug>`

Redirect behavior:
1. logs click event with `click_id`
2. redirects to destination URL
3. appends query params:
   - `utm_source=cliploop`
   - `utm_medium=short_form`
   - `utm_campaign=<tracking_slug>`
   - `clp_post=<content_item_id>`
   - `clp_click=<click_id>`

Attribution priority:
1. `clickId`
2. `contentItemId`
3. `projectId`

## Click ID persistence helper

Use the helper script on your site:

```html
<script src="https://YOUR_CLIPLOOP_DOMAIN/api/tracking/script.js" defer></script>
```

It stores `clp_click` to localStorage/cookie and exposes:
- `window.ClipLoopTracking.getClickId()`

## Conversion and revenue ingestion

### Conversion endpoint
`POST /api/track/conversion`

```json
{
  "clickId": "<from clp_click>",
  "eventType": "signup",
  "externalUserId": "user_123"
}
```

### Revenue endpoint
`POST /api/track/revenue`

```json
{
  "clickId": "<from clp_click>",
  "source": "manual",
  "amount": 4900,
  "currency": "USD",
  "eventName": "purchase"
}
```

## Manual performance rollup

- `POST /api/strategy-cycles/[strategyCycleId]/rollup`
- `GET /api/strategy-cycles/[strategyCycleId]/performance`

Score formula:
- `(revenue * 100) + (signups * 20) + (clicks * 2) + (ctr * 5)`

Classification:
- winner / neutral / loser by relative weekly ranking.

## Manual iteration workflow (MVP)

1. Publish mock content.
2. Generate clicks/conversions/revenue.
3. Run weekly rollup.
4. Click **Analyze this week**.
5. Inspect winners/losers, improved hooks, and angle mutations.
6. Click **Generate next week**.
7. Review the next cycle and derived posts.

Notes:
- Next cycle source is `iteration`.
- Next cycle week starts at current week + 7 days.
- `parent_content_item_id` tracks lineage from winner posts to derived next-week posts.
- Iteration is manual in MVP (no autonomous job runner).

## Local test flow for full loop

1. Publish mock content item in dashboard.
2. Click its tracking link (`/r/<slug>`).
3. Send conversion with returned `clp_click`.
4. Send revenue event.
5. Run rollup for the week.
6. Run analysis + generate next cycle.
7. Verify metrics/analysis on week/project pages.

## Current statuses

Publish statuses:
- `draft`, `approved`, `scheduled`, `publishing`, `published`, `failed`, `skipped`

Queue statuses:
- `pending`, `running`, `completed`, `failed`, `dead`

## Generated files

Rendered outputs are stored locally under:
- `public/generated/content-items/<contentItemId>/<timestamp>/rendered.mp4`
- `public/generated/content-items/<contentItemId>/<timestamp>/thumbnail.jpg`

## API routes (high-level)

- Generation: projects/strategy/posts/regenerate
- Rendering: render one/all + assets
- Publishing workflow: approve/schedule/run jobs
- Tracking: redirect + script + conversion/revenue ingest
- Metrics: rollup + cycle/project performance
- Iteration: analyze + generate-next + analysis + project next-cycle

## Current limitations

- Only Instagram real publishing is supported today.
- TikTok publishing is not implemented yet.
- No cron or distributed workers yet.
- Attribution is intentionally simple.
- No advanced analytics dashboards/charts.
- Iteration is deterministic/mock-driven and manually triggered.

## Public launch surface

ClipLoop now has a public-facing launch surface intended to collect serious beta users and paid interest without overselling missing features.

Public routes:
- `/` landing page
- `/pricing`
- `/request-access`

Public positioning:
- short-form growth automation for indie apps
- one weekly generated promo pack
- render, approve, schedule, publish, track, learn, repeat
- invite-only beta
- cheap, opinionated, intentionally narrow

Good fit:
- indie apps
- solo founders
- small SaaS products
- builders who want one weekly loop instead of a broad social suite

Not a fit:
- agencies managing many brands
- large social teams
- users expecting unlimited generation or fully polished multi-channel automation today

## Invite-only beta + billing-ready MVP slice

ClipLoop now supports invite-only product access plus hard usage enforcement for sellable MVP packaging.

### Invite-only behavior
- Controlled by `INVITE_ONLY_MODE` (default `true`).
- When enabled, only users who are beta-approved (or paid starter) can use product workflows.
- Non-approved users see a waitlist/request-access screen in dashboard.
- In `MOCK_MODE`, the demo user is auto-approved to keep local dev frictionless.

### Plan model (MVP)
- `free`: account exists but product access can be gated.
- `beta`: approved invite-only testers with production-like limits.
- `starter`: paid $5/month Starter plan with the same hard limits in this slice.

### Hard limits currently enforced server-side
- 1 active project
- 5 posts generated per week
- 20 posts generated per month
- 3 manual regenerations per week
- 20 renders per month
- 20 publishes per month
- 1 connected channel (future-compatible limit placeholder)

Usage counters are updated by generation/regeneration/render/publish flows and enforced in API-triggered workflows.
Weekly and monthly usage are stored separately, so the current window summaries do not double count cross-period actions.

### Lemon Squeezy billing
- `POST /api/billing/checkout` creates a real hosted Lemon Squeezy checkout for the Starter variant.
- `/pricing` now exposes a live Starter CTA.
- `/billing/success` and `/billing/cancel` provide post-checkout return states.
- `POST /api/webhooks/lemonsqueezy` verifies the `X-Signature` header and syncs subscription lifecycle changes into the existing account model.
- `POST /api/billing/portal` refreshes a Lemon Squeezy customer-portal URL from the current subscription and redirects the user into self-serve billing management.

### Subscription state model
- `subscriptions` now stores Lemon Squeezy IDs, provider status, management URLs, and current period dates alongside the earlier placeholder billing fields.
- Webhooks are the source of truth for Starter activation and downgrade decisions.
- Effective plan is derived from user beta approval plus the synced subscription status.
- `GET /api/me/plan` and `GET /api/me/usage` expose plan/usage for UI surfaces.

### Access-state precedence
- Active paid Starter access grants product access even when invite-only mode is enabled.
- Beta-approved users keep beta access unless a paid Starter subscription temporarily supersedes it.
- If a Starter subscription fully expires, access falls back to `beta` when the user is beta-approved, otherwise to gated `free`.
- Cancel-at-period-end subscriptions keep Starter access until the synced current period end.

### Access requests
- `POST /api/access/request` stores waitlist/access requests.
- Repeat requests for the same email while still pending are deduped instead of creating noisy duplicates.

### Development approval helper
- In mock mode only: `POST /api/dev/approve-user` with:

```json
{
  "email": "user@example.com",
  "plan": "beta"
}
```

This sets beta approval and plan state without building a full admin panel.

### Settings and onboarding polish
- `/dashboard/projects/new` now guides users through the workflow more clearly before their first strategy cycle.
- `/dashboard`, `/dashboard/projects/[projectId]`, and `/dashboard/settings` show plan state, usage remaining, and product-readiness status so the MVP feels operational.

### Billing environment variables
Add these to `.env`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_STARTER_VARIANT_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
```

### Local webhook testing
1. Run the app locally.
2. Expose your local app publicly with a tunnel such as ngrok or Cloudflare Tunnel.
3. Create a Lemon Squeezy webhook pointing to:
   - `https://YOUR_PUBLIC_URL/api/webhooks/lemonsqueezy`
4. Subscribe at minimum to:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_resumed`
   - `subscription_expired`
   - `subscription_paused`
   - `subscription_unpaused`
5. Use a test-mode Starter variant in Lemon Squeezy if you want to exercise the flow without charging real cards.

### Current billing limitations
- ClipLoop currently supports one paid plan only: Starter monthly.
- The app uses Lemon Squeezy hosted checkout and customer-portal links rather than a custom in-app billing portal.
- Real auth is still minimal, so in non-mock environments the checkout launcher relies on the email entered at checkout start to create or match the account record.
