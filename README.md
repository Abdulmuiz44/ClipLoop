# ClipLoop

ClipLoop is a lean AI-powered growth automation tool for indie apps and small SaaS products.

It generates weekly packs of short-form slideshow videos, schedules them for publishing, tracks clicks, signups, and revenue, and improves future content based on what performs best.

The goal is simple:

Turn short-form content into a repeatable weekly growth loop for small software products.

## Who it is for

ClipLoop is built for:

- Indie hackers
- Solo founders
- Small SaaS builders
- App creators who want distribution without becoming full-time content marketers

## Core loop

1. The user adds their product, niche, audience, offer, and CTA.
2. ClipLoop generates a weekly content strategy.
3. ClipLoop turns that strategy into short-form slideshow-style promo posts.
4. ClipLoop renders the posts into vertical videos.
5. ClipLoop schedules and publishes the posts.
6. ClipLoop tracks clicks, signups, and revenue.
7. ClipLoop identifies winners and improves the next weekly batch.

## MVP focus

ClipLoop is intentionally narrow.

The MVP exists to prove one thing:

A single founder with a single product on a single platform can use AI-generated short-form content to drive measurable clicks, signups, or revenue on a simple weekly loop.

### In scope for v1

- One user
- One project
- One connected social channel
- Weekly content pack generation
- Slideshow-style short videos
- Scheduling and publishing
- Basic click and conversion tracking
- Simple winner vs loser iteration logic
- Manual approval before publishing
- Download fallback if publishing fails

### Out of scope for v1

- Multi-project workspaces
- Team collaboration
- Advanced analytics dashboards
- Complex onboarding
- TikTok native publishing in first release
- RevenueCat-first integrations
- Full creative editor
- AI avatars
- Talking-head video generation
- Trend scraping
- Unlimited content generation
- Agency features

## Product positioning

ClipLoop is the cheapest useful growth loop for indie apps through short-form content.

Instead of giving users a bloated social media suite, ClipLoop gives them one simple outcome:

A weekly pack of conversion-focused short-form content designed to get clicks, signups, and revenue.

## Proposed stack

- Next.js
- TypeScript
- Node.js
- Postgres or Supabase
- Supabase Auth
- Supabase Storage
- FFmpeg for slideshow rendering
- Background jobs via DB-backed queue and cron
- LLM provider abstraction for generation and iteration

## Core modules

- Product onboarding
- Content strategy generation
- Post generation
- Video rendering
- Scheduling and publishing
- Click and conversion tracking
- Weekly iteration engine

## Success criteria for the MVP

ClipLoop v1 is successful if a user can:

- create one project
- generate one week of content
- render the content into videos
- schedule or download the videos
- track clicks from unique links
- send basic conversion or revenue events
- generate the next week based on what performed best

## Vision

ClipLoop should feel like a tiny autonomous growth assistant for indie software products.

Not a full social media platform.

Not a giant analytics suite.

Just a simple system that keeps producing, testing, and improving short-form growth content every week.

## Status

Planning and MVP build phase.
