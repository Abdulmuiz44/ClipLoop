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
  | "manual_queue_ops";

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
};

export function getBillingPolicy(action: BillingActionId): BillingPolicyEntry {
  return BILLING_POLICY[action];
}
