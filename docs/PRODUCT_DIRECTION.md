# ClipLane Product Direction

## Vision

ClipLane is a **programmable video generation platform**.

Developers, creators, businesses, and apps send structured inputs — prompts, code, product data, scene specs — and ClipLane returns rendered video artifacts through an API. The dashboard is the operator surface for humans. The API is the programmable surface for machines.

## What ClipLane Is

- An API-first video generation engine
- A credit-backed platform: pay per generation, no subscriptions required
- A dashboard for monitoring usage, managing API keys, and reviewing outputs
- A foundation for SDKs and CLIs that make video generation scriptable

## What ClipLane Is Not Yet

- A full render farm (coming later)
- A browser-based editor
- A subscription SaaS with seat billing
- A one-trick weekly promo tool (that is only the first wedge)

## Why Weekly Promo Is the First Wedge

Weekly promo videos for indie app builders are a tight, high-frequency use case:

- clear input (website, app description, brand voice)
- clear output (short-form vertical video, 15–60s)
- clear value (social content every week without hiring a video editor)
- clear monetization (credits per generation, predictable cost)

Nailing this wedge proves the pipeline, the credit model, and the developer experience before expanding to generic video generation.

## API-First Direction

Everything below the dashboard is API-driven:

- authenticated via Bearer API keys with scoped permissions
- charged via credits deducted per operation
- idempotent where side effects matter
- observable via usage events, credit ledger, and `/api/me/usage`

The public API is the long-lived contract. The dashboard is a consumer of that API.

## Dashboard Role

The dashboard (`app.cliplane.site/dashboard`) is:

- the onboarding surface for new users
- the API key management console
- the credit wallet and billing view
- the usage monitor (7d/30d spend, API call count)
- the bridge between human operator and programmable API

It is not the only way to use ClipLane. The API is.

## Developer API Role

The public API lets any app or script generate videos without the dashboard:

- `POST /api/public/weekly-promo` — generate a weekly promo video from a URL and optional overrides
- `POST /api/public/videos/generate` *(future)* — generic video generation from structured scene specs
- `GET /api/public/videos/:id` *(future)* — poll for render status and metadata
- `GET /api/public/videos/:id/download` *(future)* — fetch the rendered video file

All endpoints return JSON. Video artifacts are accessed via temporary signed URLs.

## SDK and CLI Roadmap

### SDK (`@cliplane/sdk`)

- TypeScript-first, with runtime support for Node and edge runtimes
- Key methods:
  - `generateWeeklyPromo(input)` — high-level wrapper for the promo endpoint
  - `generateVideo(spec)` — generic generation from scene spec
  - `getJob(id)` — poll for completion
  - `downloadVideo(id)` — stream to file
- Handles auth, idempotency, retries, and typed responses

### CLI (`cliplane`)

- `cliplane generate weekly-promo <url>` — quick one-liner
- `cliplane generate video <spec.json>` — generic generation
- `cliplane jobs` — list recent jobs
- `cliplane download <jobId>` — save video to disk

## Video Generation Pipeline

```
prompt / input
  → script (LLM: structured script + scene plan)
    → render spec (timing, overlays, voiceover, music cues)
      → render worker (HyperFrames / FFmpeg / remote worker)
        → video artifact (MP4 / WebM)
          → download URL / API response
```

Each stage is observable. Failures are recorded in the usage ledger and surfaced in the dashboard.

### Render Engine Direction

- **Now:** HyperFrames for browser/headless rendering; FFmpeg for fallback composition
- **Later:** remote render workers for heavy loads; browser/remote-control rendering if needed for preview workflows
- **Always:** renderer failures degrade gracefully. `renderStatus: fallback` or `renderer_unavailable` error lets the client retry or pull a degraded asset.

## Monetization

- **API keys:** scoped per project or per integration
- **Credits:** deducted per operation; generation and render are separate buckets
- **Pay per use:** no minimums, no subscriptions (current model)
- **Credit packs:** one-time top-ups when balance runs low
- **Usage dashboard:** real-time visibility into spend, balance, and API call volume

### Credit Costs

| Action | Bucket | Cost |
|--------|--------|------|
| Weekly Promo API call | Generation | 5 credits |
| Copy generation (chat) | Generation | 1 credit |
| Video generation (chat) | Generation | 1 credit |
| Video render (chat) | Render | 1 credit |
| Strategy cycle | Generation | 5 credits |

Monthly generation and render grants are applied automatically per plan.

## Future Endpoints

- `POST /api/public/weekly-promo` — existing promo generator
- `POST /api/public/videos/generate` — generic video generation
- `GET /api/public/videos/:id` — job status + metadata
- `GET /api/public/videos/:id/download` — signed download URL

## Near-Term Roadmap

1. Finish API key testing and wire top-up / credit pack checkout
2. Ship public weekly promo API docs at docs.cliplane.site
3. Usage dashboard with credit wallet and transaction history
4. SDK v0 (TypeScript, `generateWeeklyPromo`, `generateVideo`)
5. CLI v0 (`cliplane generate`, `cliplane jobs`, `cliplane download`)
6. Generic video generation endpoint (`POST /api/public/videos/generate`)
7. Render worker scaling (remote workers, queue-based processing)
8. Expand credit packs and introduce render-specific packs
9. Changelog and versioning strategy for the public API

Weekly Promo is only the first API product. ClipLane’s bigger mission is programmable video generation.
