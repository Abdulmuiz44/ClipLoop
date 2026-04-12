# ClipLoop Architecture

## Architecture goal

Build a lean, single-app system that supports the full weekly content loop for one user and one product with low infra cost and minimal operational complexity.

## High-level stack

- Frontend and API: Next.js
- Language: TypeScript
- Database: Postgres via Supabase
- Auth: Supabase Auth
- Storage: Supabase Storage
- Background jobs: DB-backed queue + cron-triggered worker
- Video rendering: FFmpeg
- AI generation: model-agnostic LLM provider wrapper
- Billing: Stripe
- Tracking: first-party redirect + lightweight conversion endpoint

## System shape

ClipLoop should remain a single deployable app in MVP.

The app contains:

- marketing pages
- dashboard pages
- API routes
- background job runner
- domain services
- publisher adapters
- prompt templates
- render utilities

No microservices in v1.

## Core domains

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
- signup or purchase event posts click id back to ClipLoop
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
