# ClipLoop Billing & Credits

## Credit Types

ClipLoop uses a **dual-bucket credit system**:

| Bucket | Used For | Example Cost |
|--------|----------|-------------|
| `generation` | AI content generation (LLM calls) | Weekly promo generation = 5 credits |
| `render` | Video rendering (HyperFrames) | Video render = 1 credit |

## How Credits Are Charged

1. **Monthly grant** — Users receive credits at the start of each billing period based on their plan limits.
2. **Per-action charge** — Each billable action debits the appropriate bucket:
   - `api_weekly_promo_generate` → 5 generation credits
   - `chat_generate_copy` → 1 generation credit
   - `strategy_cycle_generate_posts` → 5 generation credits
   - `content_item_render` → 1 render credit
3. **Credit reservation** — Credits are checked BEFORE the action runs (`assertCanAffordAction`). If insufficient, a `402 CREDITS_INSUFFICIENT` error is returned.
4. **Final charge** — Credits are debited AFTER successful completion via `chargeCredits`.
5. **Idempotency** — Same reference (idempotency key / reference ID) cannot double-charge.

## Credit Pack Config (In-Memory)

Packs are defined in `src/core/billing/policy.ts` as in-memory constants.
They are loaded at startup and returned via the credits policy module.

| Pack ID | Bucket | Credits | Price (USD) |
|---------|--------|---------|-------------|
| `starter_generation` | generation | 100 | $9 |
| `pro_generation` | generation | 500 | $29 |
| `render_pack` | render | 50 | $19 |

## Current API Cost

| Endpoint | Credits Charged | Bucket |
|----------|----------------|--------|
| `POST /api/public/weekly-promo` | 5 | generation |

## Credit Purchase Flow (Future)

When Lemon Squeezy is configured with credit pack products:

1. User clicks "Buy" on a credit pack in the dashboard.
2. Dashboard calls `POST /api/billing/checkout` with `variantId` matching the pack.
3. Lemon Squeezy creates a checkout session, user completes payment.
4. Lemon Squeezy sends `order_created` webhook to `POST /api/webhooks/lemonsqueezy`.
5. Webhook verifies signature (`x-signature` header).
6. Webhook maps `variant_id` → credit pack → credits → bucket.
7. `creditTopUp()` creates a ledger entry with reason `purchase` and credits the account.
8. Duplicate webhook deliveries are prevented by the unique constraint on `(user_id, reference_type, reference_id)` → `("lemon_order", order_id)`.

### Env Vars for Purchase Flow

```
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_STARTER_VARIANT_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
CREDIT_PACK_STARTER_VARIANT_ID=  # variant_id for starter_generation pack
CREDIT_PACK_PRO_VARIANT_ID=      # variant_id for pro_generation pack
CREDIT_PACK_RENDER_VARIANT_ID=   # variant_id for render_pack
```

### Webhook Safety Rules

- **Always verify** `x-signature` header before processing.
- **Idempotent ledger entries** — unique constraint on `(user_id, reference_type, reference_id)` prevents double-crediting.
- **Known variant IDs only** — unknown variants are logged but not credited.
- **No fake payments** — all credit additions go through verified webhooks or manual adjustments only.

## Admin Tools

### Manual Credit Top-Up

In `MOCK_MODE=true` or for admin debugging, the `creditTopUp()` service function can be called directly:

```typescript
import { creditTopUp } from "@/domains/credits/service";

await creditTopUp({
  userId: "user-uuid",
  bucket: "generation",
  amount: 100,
  referenceType: "manual_adjustment",
  referenceId: "admin-note-here",
  metadata: { note: "Manual top-up for testing" },
});
```

**No credit purchase UI should fake payment success.** All credit additions must be verifiable through the ledger.

## DB Schema Changes (0022)

Migration `0022_credit_purchase.sql` adds the `purchase` value to the `credit_reason` enum:

```sql
ALTER TYPE "credit_reason" ADD VALUE IF NOT EXISTS 'purchase';
```

This enables ledger entries with reason `"purchase"` for credit pack top-ups.

## Tests

- `src/tests/core-billing-policy.test.ts` — validates billing policy entries
- `src/tests/billing-idempotency.integration.test.ts` — validates idempotent credit charging
