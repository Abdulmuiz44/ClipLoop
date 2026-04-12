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

## Manual publish workflow (mock-only)

1. Generate posts for a weekly cycle.
2. Render each post (or render all).
3. Approve one post (or approve all).
4. Schedule publish times (single or bulk).
5. Run due jobs manually from the weekly page (`Run due jobs now`).
6. Items move through publish states and end at `published` (mock publisher).

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

- Publishing is mock-only (no real Instagram/TikTok APIs yet).
- No cron or distributed workers yet.
- Attribution is intentionally simple.
- No advanced analytics dashboards/charts.
- Iteration is deterministic/mock-driven and manually triggered.

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
- `starter`: paid $5 plan target with same hard limits in this slice.

### Hard limits currently enforced server-side
- 1 active project
- 5 posts generated per week
- 20 posts generated per month
- 3 manual regenerations per week
- 20 renders per month
- 20 publishes per month
- 1 connected channel (future-compatible limit placeholder)

Usage counters are updated by generation/regeneration/render/publish flows and enforced in API-triggered workflows.

### Billing-ready state
- `subscriptions` table stores status plus Stripe IDs (`stripe_subscription_id`, `stripe_price_id`) and current period.
- Effective plan is derived from user + subscription status.
- `GET /api/me/plan` and `GET /api/me/usage` expose plan/usage for UI surfaces.

### Access requests
- `POST /api/access/request` stores waitlist/access requests.

### Development approval helper
- In mock mode only: `POST /api/dev/approve-user` with:

```json
{
  "email": "user@example.com",
  "plan": "beta"
}
```

This sets beta approval and plan state without building a full admin panel.

### Current billing limitations
- No full Stripe checkout/customer portal flow yet.
- Subscription state is persisted and read, but checkout/session wiring is intentionally deferred.
