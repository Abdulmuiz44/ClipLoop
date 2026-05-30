# Billing & Credits

## Credit Types

ClipLoop uses a dual-credit system:

| Bucket | Purpose | Used By |
|--------|---------|---------|
| **Generation** | LLM prompts, copy generation, API calls | Chat copy gen, weekly promo API, strategy cycles |
| **Render** | Video rendering | Video gen + render (chat) |

## Credit Charges

One credit = one unit. Actions charge as follows:

| Action | Bucket | Cost |
|--------|--------|------|
| Plain chat message | — | Free |
| Copy generation (chat) | Generation | 1 |
| Video generation (chat) | Generation | 1 |
| Video render (chat) | Render | 1 |
| Weekly promo pack (chat) | Generation | 5 |
| Content item regenerate | Generation | 1 |
| **POST /api/public/weekly-promo** | Generation | **5** |
| Export bundle | — | Free |

## Monthly Grants

At the start of each billing period, free-plan users receive:

- **12 generation credits**
- **6 render credits**

These are applied automatically the first time you perform a billable action each month.
Pro plan users receive higher limits (80 generation / 40 render).

## Insufficient Credits

- Chat: returns an error message in the UI.
- API: returns `402 Payment Required` with a JSON body explaining which bucket is low.

## Credit Pack Purchases

One-time credit packs are planned via Lemon Squeezy:

| Pack | Bucket | Credits | Price |
|------|--------|---------|-------|
| Starter Generation | Generation | 100 | $9 |
| Pro Generation | Generation | 500 | $29 |
| Render Pack | Render | 50 | $19 |

Packs are one-time purchases. Credits never expire.

### Future Webhook Flow (not yet wired)

```
User clicks Buy → Lemon Squeezy checkout → order_created webhook
  → POST /api/webhooks/lemonsqueezy (validates signature)
  → syncLemonSqueezyOrder() identifies variant ID
  → creditTopUp() creates credit ledger entry
  → User sees balance update on next dashboard load
```

### Required Environment Variables

```env
# Lemon Squeezy API
LEMON_SQUEEZY_API_KEY=          # LS API key for verify/validate
LEMON_SQUEEZY_WEBHOOK_SECRET=    # Webhook signing secret

# Credit pack variant IDs
CREDIT_PACK_STARTER_VARIANT_ID=
CREDIT_PACK_PRO_VARIANT_ID=
CREDIT_PACK_RENDER_VARIANT_ID=

# Optional: direct checkout URLs (replaces variant-based flow)
CREDIT_PACK_STARTER_CHECKOUT_URL=
CREDIT_PACK_PRO_CHECKOUT_URL=
CREDIT_PACK_RENDER_CHECKOUT_URL=
```

## Renderer Fallback Behavior

When HyperFrames renderer is unavailable:

- The API returns `200 OK` with `renderStatus: "renderer_unavailable"` and `previewUrl: null` or `"pending"`.
- Generation credits are still charged — the LLM work was completed.
- Render credits are **not** charged when the renderer is unavailable.
- You can retry later with the same idempotency key to resume from cached LLM output.

## Idempotency

All credit charges use an `idempotencyKey` / `referenceId` pair. Replaying the same request:

- Does **not** double-charge credits.
- Returns the same response as the original request.
- Uses a unique constraint on `(user_id, reference_type, reference_id)`.

## Verification

Tests in `src/tests/billing-idempotency.integration.test.ts`:
- Single charge deducts the correct amount.
- Replay returns idempotent result (no double charge).
- Insufficient credits returns 402 / InsufficientCreditsError.
- Concurrent requests maintain correctness.

Run: `npm run test:billing`
