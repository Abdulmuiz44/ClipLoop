# ClipLoop Database Spec

## Goal

Define the minimum viable database schema for ClipLoop so the full weekly loop can work:

- onboarding
- strategy generation
- post generation
- rendering
- scheduling
- publishing
- tracking
- iteration
- billing limits

This schema is intentionally lean.

It is built for:
- one user
- one project
- one primary channel
- one weekly content cycle
- simple attribution
- low operational complexity

## Design principles

- Prefer simple normalized tables over clever abstractions.
- Store source-of-truth entities in relational columns.
- Use JSON only for flexible AI-generated content shapes like slides, angles, and metadata.
- Keep raw events and aggregate metrics separate.
- Make every major step inspectable and retryable.
- Preserve manual fallback paths.

## Recommended stack

- Postgres
- Supabase
- Drizzle ORM
- SQL migrations in versioned files

---

## Enums

These can be native Postgres enums or string check constraints.

### `plan_type`
- `free`
- `starter`
- `beta`

### `project_goal_type`
- `clicks`
- `signups`
- `revenue`

### `platform_type`
- `instagram`
- `tiktok`

### `content_type`
- `slideshow_video`

### `strategy_cycle_source`
- `initial`
- `iteration`
- `manual_regeneration`

### `render_status`
- `pending`
- `queued`
- `rendering`
- `completed`
- `failed`

### `publish_status`
- `draft`
- `approved`
- `scheduled`
- `publishing`
- `published`
- `failed`
- `skipped`

### `asset_type`
- `video`
- `thumbnail`
- `subtitle_json`

### `event_type`
- `signup`
- `trial_started`
- `purchase`

### `revenue_source`
- `stripe`
- `revenuecat`
- `manual`

### `experiment_mutation_type`
- `hook`
- `cta`
- `angle`
- `structure`

### `job_status`
- `pending`
- `running`
- `completed`
- `failed`
- `dead`

### `job_type`
- `generate_weekly_strategy`
- `generate_weekly_posts`
- `render_content_item`
- `publish_content_item`
- `fetch_platform_metrics`
- `compute_performance_rollup`
- `generate_iteration_cycle`

---

## Tables

## 1. users

Represents the authenticated account owner.

### Fields
- `id` uuid primary key
- `email` text unique not null
- `full_name` text nullable
- `plan` text not null default `free`
- `billing_status` text nullable
- `stripe_customer_id` text nullable
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
- In MVP, each user can have one active project on the base plan.
- Billing status can stay simple in v1.

### Indexes
- unique index on `email`
- index on `stripe_customer_id`

---

## 2. projects

Stores the product and content context for one customer project.

### Fields
- `id` uuid primary key
- `user_id` uuid not null references `users(id)` on delete cascade
- `name` text not null
- `product_name` text not null
- `one_liner` text nullable
- `description` text not null
- `audience` text not null
- `niche` text not null
- `offer` text not null
- `project_type` enum(`business`,`creator`,`app`) nullable
- `business_name` text nullable
- `business_category` text nullable
- `business_description` text nullable
- `city` text nullable
- `state` text nullable
- `target_audience` text nullable
- `primary_offer` text nullable
- `price_range` text nullable
- `tone` text nullable
- `call_to_action` text nullable
- `instagram_handle` text nullable
- `whatsapp_number` text nullable
- `preferred_channels` text nullable
- `preferred_channels_json` jsonb not null default `[]` (normalized channels: `instagram`, `tiktok`, `whatsapp`)
- `language_style` enum(`english`,`pidgin`,`mixed`) nullable
- `website_url` text nullable
- `cta_url` text not null
- `goal_type` text not null
- `voice_prefs_json` jsonb nullable
- `example_posts_json` jsonb nullable
- `avoid_terms_json` jsonb nullable
- `logo_url` text nullable
- `brand_settings_json` jsonb nullable
- `status` text not null default `active`
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Suggested JSON structure
`voice_prefs_json`
```json
{
  "tone": "direct",
  "style_notes": "simple, punchy, no jargon"
}
```

### `content_items` channel-aware additions
- `target_channel` enum(`instagram`,`tiktok`,`whatsapp`) not null default `instagram`
- `publish_strategy` enum(`direct_instagram`,`manual_export`) not null default `direct_instagram`
- `manual_publish_status` enum(`ready_for_export`,`exported`,`posted`) not null default `ready_for_export`
- `channel_captions_json` jsonb nullable
- `channel_cta_text_json` jsonb nullable

These fields hold explicit channel intent and per-channel variants used for channel-native output while preserving the existing render/publish/tracking pipeline.
`manual_publish_status` tracks operator-confirmed state for manual workflows (TikTok/WhatsApp and optional Instagram manual export).

---

## Billing/access additions (MVP packaging slice)

### `subscriptions`
- tracks billing-ready state for a user
- supports nullable Stripe identifiers and period windows
- used for deriving effective starter access

### `access_requests`
- stores invite-only beta requests from gated users
- enables manual approval flow in early beta

### `users` additions
- `is_beta_approved` boolean default false
- `beta_approved_at` timestamptz nullable

### Usage enforcement notes
- `usage_counters` are incremented by:
  - post generation (weekly + monthly)
  - manual regeneration (weekly)
  - render completion (monthly)
  - publish completion (monthly)
- limit checks are applied server-side before mutating workflows.

---

## Chat-first additions

The product now uses a chat-first primary UX. New DB structures:

### `projects` additions
- `context_notes` text nullable
- `context_settings_json` jsonb not null default `{}`

### `project_context_documents`
- stores ingested website/page context as normalized text per project
- key fields:
  - `project_id`
  - `source_url`
  - `title`
  - `content_text`
  - `content_hash`
  - `metadata_json`

### `conversations`
- user-owned chat threads
- optional `project_id` link for business-context scope

---

## Credit ledger additions

ClipLoop billing-grade credit accounting is ledger-backed.

### `credit_accounts`
- one row per user
- running balances:
  - `generation_balance`
  - `render_balance`
- this table is the balance source of truth shown in product surfaces

### `credit_ledger_entries`
- immutable credit transactions (credit/debit)
- key fields:
  - `user_id`
  - `credit_account_id`
  - `bucket` (`generation` or `render`)
  - `direction` (`credit` or `debit`)
  - `reason` (monthly grant or billable action reason)
  - `amount_delta`
  - `balance_after`
  - optional `reference_type` + `reference_id` for idempotency and traceability
  - `metadata_json` for action linkage (chat job/content item)
  - `created_at`

### Idempotency behavior
- Paid action debits use unique references (for example `chat_job` keys)
- Retries return existing ledger entries instead of creating duplicate charges

### Compatibility behavior
- `usage_counters` remain in place for compatibility/reporting
- charging and available-balance decisions are made from ledger state, not counters
- chat paid actions (`generate_copy`, `generate_video`) are ledger-gated and ledger-charged
- non-chat billable generation/render flows are also ledger-gated and ledger-charged
- usage counters continue to update after successful operations for reporting/analytics compatibility
- billing action definitions are centralized in `src/domains/credits/policy.ts` (billable vs non-billable, bucket, amount, reason)

### Operational vs billing limits
- billing decisions for paid generation/render are ledger-first
- remaining usage-limit assertions are restricted to non-billing operational limits (for example project creation caps and publish scheduling caps)

### `conversation_messages`
- append-only chat messages per conversation
- role enum: `user | assistant | system`
- kind enum: `text | status | result`
- `metadata_json` stores result payload details (caption/CTA/video URLs/etc.)

### `chat_jobs`
- durable orchestration records for chat-triggered generation/render operations
- links request message, status, target channel, and resulting content item when available
- status enum: `queued | running | completed | failed`

### Credit accounting note
- dedicated ledger-backed accounting is now used:
  - `credit_accounts` = current per-user balances (`generation_balance`, `render_balance`)
  - `credit_ledger_entries` = immutable transaction history (`credit/debit`, reason, amount delta, balance snapshot)
  - monthly plan grants are recorded as ledger credit entries (`credit_reason = monthly_grant`)
  - paid actions record debits with per-action reference metadata for receipts/audit
- free chat messages do not consume credits
- compatibility transition:
  - `usage_counters` are still incremented for existing limits/reporting logic
  - ledger balances are the billing source of truth for charge/block decisions
