# ClipLoop MVP Plan

## Product goal

Help indie apps and small SaaS products grow through a simple weekly short-form content loop:

generate, render, schedule, track, and improve.

## MVP thesis

If ClipLoop can help one founder with one product on one channel generate measurable clicks or signups from a weekly pack of short-form videos, the core product is validated.

## v1 scope

### Included

- Single user flow
- Single project per account
- Single connected social channel
- One weekly content pack
- 5 posts per week
- Slideshow-style vertical videos only
- AI-generated strategy, hooks, slides, captions, hashtags, and CTA
- Scheduled publishing
- Basic tracked links
- Basic conversion and revenue events
- Weekly winner vs loser iteration
- Approval before publishing
- Download fallback if auto-publishing fails

### Excluded

- TikTok native publishing in the first release
- Multi-channel publishing
- Team accounts
- Advanced analytics dashboards
- Visual template editor
- Voiceover or avatars
- Stock footage generation
- Trend scraping
- Competitive intelligence
- RevenueCat-first support
- Unlimited usage

## Primary user

A solo founder or small SaaS builder who wants consistent short-form promotional content without doing strategy, copywriting, design, scheduling, and performance review manually every week.

## Core modules

## 1. Onboarding

Purpose:
Capture enough product context to generate useful content without long setup.

Inputs:
- product name
- product description
- audience
- niche
- offer
- CTA URL
- content goal
- voice preferences
- example posts

Outputs:
- project record
- normalized content context

Done when:
- user can create a project in one flow
- project context is stored and reusable for future cycles

## 2. Strategy generation

Purpose:
Turn project context into one week of content angles.

Outputs:
- strategy summary
- 5 angles
- hook options
- CTA recommendation
- proof style recommendation

Done when:
- system can generate one weekly strategy cycle
- output is validated and stored as structured JSON

## 3. Post generation

Purpose:
Turn angles into concrete posts.

Outputs per post:
- internal title
- hook
- 5 to 7 slides
- caption
- hashtags
- CTA
- destination URL

Done when:
- strategy can produce 5 concrete posts
- user can regenerate a single post without regenerating everything

## 4. Rendering

Purpose:
Convert each post into a simple vertical slideshow video.

Requirements:
- fixed templates only
- text-first video
- 1080x1920 output
- thumbnail generation
- asset upload to storage

Done when:
- a content item can render into a usable MP4
- rendered asset is saved and previewable

## 5. Scheduling and publishing

Purpose:
Allow the user to assign publish times and automate distribution.

Requirements:
- store schedule time per post
- queue publish jobs
- publish to one platform
- track publish status and retry failures
- allow download fallback

Done when:
- the user can approve and schedule the weekly pack
- background worker can publish queued posts

## 6. Tracking

Purpose:
Measure whether posts drive meaningful outcomes.

Requirements:
- unique tracked link per post
- redirect endpoint logs clicks
- basic conversion ingestion endpoint
- revenue ingestion via webhook or manual event push
- nightly rollup or on-demand aggregate

Done when:
- clicks appear per post
- signups and revenue can be attributed at least loosely to a post or click

## 7. Iteration

Purpose:
Use performance data to improve the next weekly batch.

Requirements:
- compute simple per-post score
- classify winner, neutral, loser
- generate next-week hook mutations and angle variations
- create next strategy cycle from top-performing patterns

Done when:
- system can produce a next weekly pack informed by prior results

## Weekly usage cap for MVP

- 1 project
- 5 posts per week
- 20 posts per month
- 1 weekly strategy generation
- 3 manual post regenerations per week
- 1 connected channel

## Success criteria

ClipLoop MVP is done when a user can:

1. sign up
2. create a project
3. generate a weekly strategy
4. generate 5 posts
5. render them into videos
6. schedule them
7. publish or download them
8. track clicks
9. ingest simple conversion or revenue events
10. generate the next batch from winners

## Guardrails

- Keep every flow opinionated
- Prefer fixed templates over flexible builders
- Prefer one-click defaults over too many settings
- Generate in batches to reduce LLM costs
- Do not overengineer integrations
- Always preserve manual fallback paths
