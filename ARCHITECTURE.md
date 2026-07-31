# ClipLane Architecture (Open Core + Hosted Gateway Direction)

## Product Direction

ClipLane is evolving into three layers:

1. First-party app (ClipLane UX for brands/businesses/creators)
2. Open core engine (reusable creative video operating system logic)
3. Paid hosted gateway (managed API key platform, orchestration, rendering, provider access, and credit controls)

This repository remains a single app deploy today, but now includes explicit internal boundaries for future extraction.

## Layer Ownership (Current)

### A) First-party app layer

Owns product UX and route orchestration:

- `src/app/*` (App Router pages + route handlers)
- `src/components/*` (UI components and app shell behavior)
- app-specific auth/page redirects and workflow composition

### B) Open core layer

Owns reusable engine contracts and primitives:

- `src/core/llm/*`: provider contracts and provider selection boundary
- `src/core/render/*`: render adapter contracts
- `src/core/billing/*`: billing policy map and action-to-cost contracts
- `src/core/context/*`: website context contracts + ingestion primitive + context document shaping
- `src/core/types/*`: shared product-agnostic types

Compatibility wrappers currently keep legacy imports stable:

- `src/lib/llm/provider.ts` re-exports from `src/core/llm/provider.ts`
- `src/lib/render/adapters/types.ts` re-exports from `src/core/render/contracts.ts`
- `src/domains/credits/policy.ts` re-exports from `src/core/billing/policy.ts`
- `src/domains/context/ingestion.ts` re-exports from `src/core/context/website-ingestion.ts`

### C) Hosted gateway layer (scaffold in this pass)

Owns future managed platform boundaries:

- `src/gateway/contracts.ts`: API-key auth, orchestration, provider access, render execution, and credit guard interfaces
- `src/gateway/local-adapters.ts`: local in-app adapter implementations preserving current behavior
- `src/gateway/config.ts`: gateway configuration surface for local vs hosted modes

No public `/api/gateway/*` routes are introduced yet in this pass.

## What Was Extracted In This Pass

- Core contracts extracted:
  - LLM provider contract + implementation boundary
  - Render adapter interfaces
  - Billing policy map and billing action ids
  - Context ingestion/crawl primitive and context document shape helper
- Gateway interfaces added with local adapters to current domain services.
- Existing app behavior preserved by compatibility re-exports and wrappers.

## What Remains Coupled (Intentional for Pass 1)

- Domain services still coordinate DB access, app rules, and engine steps in the same modules.
- Route handlers still call domain services directly.
- Credits ledger persistence and enforcement remain domain/database coupled.
- Render execution remains app-runtime driven; no separate worker/service boundary yet.

These couplings are intentionally preserved to avoid destabilizing production behavior.

## Next Extraction Sequence

### Pass 2

- Move strategy/content planning interfaces into `src/core/planning/*`.
- Move channel/publishing contracts into `src/core/publishing/*`.
- Introduce gateway orchestrator usage in selected API route handlers (without breaking route shapes).

### Pass 3

- Add hosted gateway entry routes and API key auth middleware.
- Introduce managed provider access flow + usage/rate limit checks.
- Split app-first adapters from hosted adapters behind `src/gateway`.

## Contributor Placement Rules

When adding code:

- Put reusable, product-agnostic logic in `src/core/*`.
- Put hosted-platform concerns in `src/gateway/*`.
- Put app UX, route wiring, and product-specific composition in `src/app/*` / `src/components/*` / domain orchestration.

If unsure, default to:
- contract in `src/core` or `src/gateway`
- adapter/wiring in app/domain layer

## 1. Projects

Responsibilities:
- create and manage product context
- store product metadata and content preferences
- expose normalized context for strategy and post generation

Key operations:
- createProject
- updateProject
- getProjectContext

## 2. Content strategy

Responsibilities:
- generate weekly content strategy from project context
- store angles, claims, hooks, CTA styles
- create a strategy cycle for each week

Key operations:
- generateWeeklyStrategy
- regenerateStrategy
- createStrategyCycle

## 3. Content items

Responsibilities:
- generate concrete posts from strategy angles
- persist structured post content
- support single-post regeneration
- attach rendering and publishing state

Key operations:
- generatePostsForWeek
- regeneratePost
- listWeeklyPack

## 4. Rendering

Responsibilities:
- turn post slides into vertical slideshow videos
- generate thumbnails
- upload assets to storage
- update render status

Key operations:
- renderContentItem
- uploadRenderAssets
- markRenderComplete

## 5. Publishing

Responsibilities:
- store connected social account credentials
- queue scheduled publishes
- call platform-specific publisher adapters
- record platform post identifiers
- retry failed publishes

Key operations:
- connectChannel
- schedulePost
- publishPost
- retryPublish

## 6. Tracking

Responsibilities:
- create tracked links
- capture click events
- accept signup and purchase events
- roll up metrics per post

Key operations:
- createTrackingSlug
- logClick
- ingestConversion
- rollupMetrics

## 7. Iteration

Responsibilities:
- classify winners and losers
- generate angle and hook improvements
- create next weekly pack from top patterns

Key operations:
- scorePosts
- classifyPerformance
- generateNextCycle
- createIterationExperiment

## Request and job flow

## Initial user flow

1. User signs up.
2. User creates a project.
3. User submits product context.
4. API triggers weekly strategy generation.
5. Strategy output is validated and stored.
6. API triggers weekly post generation.
7. Posts are stored as structured content items.
8. Render jobs are queued for each content item.
9. Worker renders videos and stores assets.
10. User reviews and approves weekly pack.
11. Schedule jobs are created.
12. Worker publishes at scheduled times.
13. Tracked links collect clicks.
14. Conversion and revenue events are ingested.
15. Weekly scoring job runs.
16. Next cycle is generated from winners.

## Queue design

Use a single `job_queue` table.

Fields:
- id
- type
- payload_json
- status
- run_at
- attempts
- locked_at
- completed_at
- last_error
- created_at

Statuses:
- pending
- running
- completed
- failed
- dead

Job types:
- generate_weekly_strategy
- generate_weekly_posts
- render_content_item
- publish_content_item
- fetch_platform_metrics
- compute_performance_rollup
- generate_iteration_cycle

Worker strategy:
- cron calls worker endpoint on a schedule
- worker fetches due jobs using row locking
- worker processes jobs in small batches
- retry up to 3 times
- leave dead jobs inspectable in admin view

## LLM abstraction

Expose one shared service such as:

- generateStructuredObject
- generateText
- repairJson

The app should not depend directly on a single vendor across domain logic.

Prompt templates live under `src/lib/prompts`.

Rules:
- batch generation where possible
- require JSON output
- validate with schema
- retry once on invalid output

## Publisher abstraction

Define a platform-agnostic publisher interface.

Example methods:
- publishVideo
- refreshAuth
- getPostMetrics

Concrete adapters:
- instagramPublisher
- tiktokPublisher later

This keeps the content and scheduling logic independent from platform specifics.

## Rendering pipeline

Input:
- slides
- template id
- project branding preferences
- optional logo

Process:
- generate frame images or draw slide compositions
- stitch into MP4 with transitions
- create thumbnail
- upload assets to storage
- save asset URLs

Constraints:
- 1080x1920
- fixed duration range
- no custom timeline editor
- no generative video models

## Tracking and attribution model

Every content item gets a unique tracking slug.

Flow:
- published caption points to tracked URL
- user clicks tracked URL
- redirect service logs click and redirects to CTA URL with UTMs
- optional site snippet stores click id on landing
- signup or purchase event posts click id back to ClipLane
- if click id is unavailable, attribute loosely at post level using UTM and recent click rules

MVP attribution priority:
1. direct click id
2. UTM post reference
3. unattributed project conversion

## Suggested folder layout

```text
src/
  app/
    page.tsx
    dashboard/
    api/
      projects/
      content/
      integrations/
      track/
      webhooks/
      jobs/
  lib/
    db/
    auth/
    prompts/
    llm/
    render/
    tracking/
    scoring/
    jobs/
    publishers/
      base.ts
      instagram.ts
      tiktok.ts
  domains/
    projects/
    strategy/
    content-items/
    rendering/
    publishing/
    metrics/
    iterations/

---

## Project Memory / Context Assembly

### Purpose

Ground every LLM interaction in structured project truth. Instead of shallow inference from loose fields, the system maintains a durable, versioned project memory snapshot and assembles a rich context payload before any generation or chat response.

### Project Memory Snapshot

Stored in the `project_memory_snapshots` table (1 project → many versioned snapshots).

A snapshot captures the full project truth at a point in time:

- **Summaries**: `whatThisProjectIsAbout` and `howClipLaneShouldCreate` — template-assembled from business fields
- **Identity block**: business name, category, type, description, location
- **Audience block**: target audience, niche
- **Offer block**: primary offer, pricing, CTA, goal type
- **Voice block**: tone, language style, voice notes
- **Channels block**: preferred channels, social handles
- **Website block**: URL, page count, last ingestion time, top page titles

### Snapshot Refresh Triggers

| Trigger | Source label | Where |
|---|---|---|
| Onboarding completed | `onboarding` | `context/service.ts::completeOnboarding` |
| Project settings updated | `settings_update` | `projects/service.ts::updateProjectSettings` |

Both call `refreshProjectMemory()` which generates a new versioned row. Snapshots are deterministic — no LLM call needed.

### Context Assembly Order

`assembleProjectContext()` in `src/domains/memory/assembler.ts` builds the full payload with strict priority:

1. **projectMemory** — latest snapshot (primary grounding source)
2. **liveFields** — current project row fields (supplements snapshot, catches drift)
3. **websiteContext** — top 3 `project_context_documents` (title + 1200-char snippet each)
4. **recentConversation** — last 5 user messages (chat mode only)
5. **currentBrief** — create brief text (create mode only)

Modes: `chat`, `generate`, `strategy`, `debug`.

### Where Context Is Injected

| Flow | How |
|---|---|
| **Chat (free)** | `buildGroundedChatPrompt()` injects `[PROJECT MEMORY]` + `[WEBSITE CONTEXT]` + `[GROUNDING]` sections |
| **Generate (paid)** | `generatePromoDraft()` receives full `AssembledContext`, renders summaries + website context |
| **Strategy generation** | `weeklyStrategyPrompt()` accepts optional `websiteContext` parameter via assembler |
| **Post generation** | `postGenerationPrompt()` accepts optional `websiteContext` parameter via assembler |

### Grounded Answering

The chat prompt instructs the LLM to answer from PROJECT MEMORY as primary source. If memory lacks information, the LLM tells the user what's missing and suggests updating project settings.

### Debug Visibility

`GET /api/projects/[projectId]/memory` returns the latest snapshot + current assembled context. Auth-protected.

### What Stays Heuristic

- **Brief planner** (`makeBrief()`) — deterministic keyword parser; memory injected at generation step
- **Channel inference** (`inferTargetChannel()`) — keyword matching; project memory provides default channel
- **Snapshot summaries** — template-assembled, not AI-written; LLM synthesizes from full structured data

### Files

```
src/domains/memory/
  service.ts       — generateProjectMemorySnapshot, getLatestProjectMemory, refreshProjectMemory
  assembler.ts     — assembleProjectContext with mode discriminator
src/app/api/projects/[projectId]/memory/
  route.ts         — GET debug endpoint
migrations/0017_project_memory_snapshots.sql  — DDL
```
