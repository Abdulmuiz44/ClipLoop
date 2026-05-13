# ClipLoop Architecture (Open Core + Hosted Gateway Direction)

## Product Direction

ClipLoop is evolving into three layers:

1. First-party app (ClipLoop UX for brands/businesses/creators)
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

