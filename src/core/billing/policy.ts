export type BillingActionId =
  | "plain_chat"
  | "chat_generate_copy"
  | "chat_generate_video_generation"
  | "chat_generate_video_render"
  | "strategy_cycle_generate_posts"
  | "content_item_regenerate"
  | "strategy_cycle_generate_next_pack"
  | "content_item_render"
  | "export_bundle"
  | "direct_instagram_publish"
  | "manual_mark_posted"
  | "manual_queue_ops"
  | "api_weekly_promo_generate";

type BillablePolicy = {
  billable: true;
  bucket: "generation" | "render";
  amount: number;
  reason:
    | "action_generate_copy"
    | "action_generate_video_generation"
    | "action_generate_video_render";
};

type NonBillablePolicy = {
  billable: false;
};

export type BillingPolicyEntry = BillablePolicy | NonBillablePolicy;

export const BILLING_POLICY: Record<BillingActionId, BillingPolicyEntry> = {
  plain_chat: { billable: false },
  chat_generate_copy: { billable: true, bucket: "generation", amount: 1, reason: "action_generate_copy" },
  chat_generate_video_generation: { billable: true, bucket: "generation", amount: 1, reason: "action_generate_video_generation" },
  chat_generate_video_render: { billable: true, bucket: "render", amount: 1, reason: "action_generate_video_render" },
  strategy_cycle_generate_posts: { billable: true, bucket: "generation", amount: 5, reason: "action_generate_copy" },
  content_item_regenerate: { billable: true, bucket: "generation", amount: 1, reason: "action_generate_copy" },
  strategy_cycle_generate_next_pack: { billable: true, bucket: "generation", amount: 5, reason: "action_generate_copy" },
  content_item_render: { billable: true, bucket: "render", amount: 1, reason: "action_generate_video_render" },
  export_bundle: { billable: false },
  direct_instagram_publish: { billable: false },
  manual_mark_posted: { billable: false },
  manual_queue_ops: { billable: false },
  api_weekly_promo_generate: { billable: true, bucket: "generation", amount: 5, reason: "action_generate_copy" },
};

export function getBillingPolicy(action: BillingActionId): BillingPolicyEntry {
  return BILLING_POLICY[action];
}

// ── Credit Pack Config ────────────────────────────────────────────────
// In-memory credit pack definitions. Actual pricing/purchase goes through
// Lemon Squeezy when configured. These values are informative defaults
// used in the dashboard "Buy Credits" UI before checkout is wired up.

export type CreditPackId = "starter_generation" | "pro_generation" | "render_pack";

export type CreditPack = {
  id: CreditPackId;
  label: string;
  description: string;
  bucket: "generation" | "render";
  credits: number;
  priceUsd: number;
  variantId?: string; // Lemon Squeezy variant ID when configured
};

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter_generation",
    label: "Starter Generation Pack",
    description: "100 generation credits — enough for ~20 weekly promos or ~100 copy generations",
    bucket: "generation",
    credits: 100,
    priceUsd: 9,
  },
  {
    id: "pro_generation",
    label: "Pro Generation Pack",
    description: "500 generation credits — bulk rate for high-volume usage",
    bucket: "generation",
    credits: 500,
    priceUsd: 29,
  },
  {
    id: "render_pack",
    label: "Render Pack",
    description: "50 render credits for video rendering",
    bucket: "render",
    credits: 50,
    priceUsd: 19,
  },
];

export function getCreditPack(id: CreditPackId): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

