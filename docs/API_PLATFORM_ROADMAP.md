# ClipLoop API Platform Roadmap

## Current State (v0 — Weekly Promo)

- `POST /api/public/weekly-promo` — generate short-form promo video from a public URL
- API keys with `weekly_promo:generate` scope
- Credit wallet (generation + render buckets)
- Usage dashboard (`/dashboard/billing`)
- 402 CREDITS_INSUFFICIENT enforcement
- Idempotency keys for deduplication
- Renderer fallback on engine failure

## v0.1 — Developer Experience

- SDK `@cliploop/sdk` (TypeScript)
  - `generateWeeklyPromo(input)`
  - `getJob(id)`
  - `downloadVideo(id)`
- CLI `cliploop`
  - `cliploop generate weekly-promo <url>`
  - `cliploop jobs`
  - `cliploop download <id>`
- docs.cliploop.site live with 8-page docs (home, quickstart, API ref, auth, credits/billing, errors, examples, changelog)

## v0.2 — Generic Video Generation

- `POST /api/public/videos/generate`
  - Accepts structured scene specs (scenes, overlays, voiceover, music)
  - Returns `jobId` immediately; video processes asynchronously
- `GET /api/public/videos/:id` — status, metadata, render logs
- `GET /api/public/videos/:id/download` — signed MP4/WebM URL
- Scene spec SDK helpers (`SceneSpec`, `Overlay`, `Voiceover`)

## v0.3 — Render Scaling

- Remote render workers (containerized, queue-based)
- Priority lanes for Pro/render-pack customers
- Render job retries with automatic fallback engine selection
- Progress streaming via SSE or webhook

## v1.0 — Programmable Platform

- Webhooks on job completion / failure
- Team accounts and org-scoped API keys
- Embeddable player and share links
- Template marketplace (community scene specs)
- Render presets (platform-optimized outputs for TikTok, YouTube Shorts, Reels)

## Non-Goals (For Now)

- Browser-based NLE editor
- Subscription seat billing
- Hosted render farm at unlimited scale
- Real-time collaborative editing

## Technical Principles

- API-first: every capability exposed through the public API before UI
- Credits-first: no free unlimited tiers at scale; pay per use
- Observability: every job, credit, and render event is logged and queryable
- Graceful degradation: renderer failures produce usable fallbacks, not hard errors
- Type safety: SDK and API schemas stay in sync via shared Zod / TypeScript types
