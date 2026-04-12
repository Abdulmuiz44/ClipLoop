### `TASKLIST.md`
```md
# ClipLoop Tasklist

## Week 1: Single-user content generation loop

### Goal

Ship the smallest usable loop where one user can create one project and generate one week of content drafts.

### Deliverables

#### Marketing and auth
- Create landing page
- Add pricing section with MVP pricing
- Add sign up and login flow
- Add authenticated dashboard shell

#### Project onboarding
- Create new project page
- Add project onboarding form
- Persist project data in database
- Create basic project settings page

#### Database foundation
- Set up Supabase project
- Add schema for users, projects, strategy_cycles, content_items
- Add migration flow
- Add Drizzle or equivalent ORM setup

#### AI generation
- Create LLM wrapper
- Add strategy generation prompt
- Add post generation prompt
- Add schema validation for AI output
- Implement generate weekly strategy API
- Implement generate weekly posts API

#### Weekly pack UI
- Create weekly strategy preview page
- Create weekly content pack page
- Display 5 generated posts
- Add regenerate single post action
- Add approve weekly pack action

### Done when
- user can sign up
- user can create one project
- user can generate one weekly strategy
- user can generate 5 post drafts
- drafts are saved and visible in dashboard

## Week 2: Rendering, scheduling, and one publishing path

### Goal

Turn generated drafts into real vertical video assets and support scheduling plus one platform publishing path.

### Deliverables

#### Rendering
- Add content_assets table
- Create two fixed slideshow templates
- Build FFmpeg render utility
- Render one content item into MP4
- Generate thumbnails
- Upload render outputs to storage
- Show render previews in dashboard

#### Scheduling
- Add schedule fields to content_items
- Create schedule UI for weekly pack
- Add schedule confirmation page
- Create job_queue table
- Build worker to process queued jobs

#### Publishing
- Define publisher interface
- Implement first platform adapter
- Add connect channel page
- Store channel credentials securely
- Add publish_content_item job
- Add publish retry logic
- Add publish status UI

#### Fallbacks
- Add manual download flow for rendered assets
- Add export ZIP or asset download page
- Ensure weekly pack remains usable if publishing fails

### Done when
- generated posts can render into videos
- user can set publish times
- background jobs can publish scheduled posts
- user can manually download videos if needed

## Week 3: Tracking, iteration, billing, and hard limits

### Goal

Close the loop by tracking outcomes and generating the next week from winners.

### Deliverables

#### Tracking
- Add tracked link generation per content item
- Create redirect endpoint
- Log click events
- Add conversion ingestion endpoint
- Add revenue ingestion path
- Add optional lightweight site snippet for click id capture

#### Metrics and scoring
- Add performance_metrics table
- Create rollup job for clicks, signups, revenue
- Compute per-post CTR
- Compute weighted post score
- Classify winner, neutral, loser

#### Iteration
- Add iteration prompt
- Generate improved hooks from winner data
- Generate next weekly strategy cycle from winners
- Create next-week content pack UI
- Show reasons why winning posts worked

#### Billing and limits
- Add Stripe billing for ClipLoop subscriptions
- Enforce one project for base plan
- Enforce weekly generation limits
- Enforce regeneration limits
- Add minimal usage accounting

#### Reliability
- Add structured logging
- Add admin page or internal debug view for failed jobs
- Add basic health check endpoint

### Done when
- each post has a tracked link
- clicks show up in dashboard
- user can send conversion or revenue events
- weekly scoring identifies winners and losers
- next week can be generated from top performers
- billing and usage caps are enforced

## Priority order

1. One user
2. One project
3. One weekly strategy
4. One weekly pack
5. One render pipeline
6. One scheduling pipeline
7. One publishing path
8. One tracking path
9. One iteration cycle

## Cut list if time gets tight

If needed, defer these without breaking MVP:
- native platform metrics pull
- in-app revenue charts
- branded template customization
- multiple post regeneration options
- advanced attribution
- automatic next-cycle approval
- multi-platform abstraction beyond first adapter

## Final MVP checkpoint

ClipLoop MVP is ready when one founder can:

- onboard their product
- generate a weekly pack
- render videos
- schedule or download them
- collect clicks
- ingest simple conversion data
- generate the next weekly pack from results
