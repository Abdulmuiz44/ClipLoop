import { relations, sql } from "drizzle-orm";
import {
  date,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan_type", ["free", "starter", "beta"]);
export const goalTypeEnum = pgEnum("project_goal_type", ["clicks", "signups", "revenue"]);
export const strategySourceEnum = pgEnum("strategy_cycle_source", ["initial", "iteration", "manual_regeneration"]);
export const renderStatusEnum = pgEnum("render_status", ["pending", "queued", "rendering", "completed", "failed"]);
export const publishStatusEnum = pgEnum("publish_status", [
  "draft",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "skipped",
]);
export const platformEnum = pgEnum("platform_type", ["instagram", "tiktok"]);
export const contentTypeEnum = pgEnum("content_type", ["slideshow_video"]);
export const assetTypeEnum = pgEnum("asset_type", ["video", "thumbnail"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "running", "completed", "failed", "dead"]);
export const jobTypeEnum = pgEnum("job_type", [
  "publish_content_item",
  "generate_weekly_strategy",
  "generate_weekly_posts",
  "render_content_item",
  "fetch_platform_metrics",
  "compute_performance_rollup",
  "generate_iteration_cycle",
]);
export const eventTypeEnum = pgEnum("event_type", ["signup", "trial_started", "purchase"]);
export const revenueSourceEnum = pgEnum("revenue_source", ["stripe", "revenuecat", "manual"]);
export const mutationTypeEnum = pgEnum("experiment_mutation_type", ["hook", "cta", "angle", "structure"]);
export const iterationStatusEnum = pgEnum("iteration_status", ["draft", "generated", "applied", "archived"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
  "expired",
]);
export const accessRequestStatusEnum = pgEnum("access_request_status", ["pending", "approved", "rejected"]);
export const usagePeriodTypeEnum = pgEnum("usage_period_type", ["week", "month"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name"),
    plan: planEnum("plan").notNull().default("free"),
    billingStatus: text("billing_status"),
    stripeCustomerId: text("stripe_customer_id"),
    lemonSqueezyCustomerId: text("lemon_squeezy_customer_id"),
    isBetaApproved: boolean("is_beta_approved").notNull().default(false),
    betaApprovedAt: timestamp("beta_approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    stripeCustomerIdx: index("users_stripe_customer_id_idx").on(table.stripeCustomerId),
    lemonSqueezyCustomerIdx: index("users_lemon_squeezy_customer_id_idx").on(table.lemonSqueezyCustomerId),
    betaApprovedIdx: index("users_is_beta_approved_idx").on(table.isBetaApproved),
  }),
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    productName: text("product_name").notNull(),
    oneLiner: text("one_liner"),
    description: text("description").notNull(),
    audience: text("audience").notNull(),
    niche: text("niche").notNull(),
    offer: text("offer").notNull(),
    websiteUrl: text("website_url"),
    ctaUrl: text("cta_url").notNull(),
    goalType: goalTypeEnum("goal_type").notNull(),
    voicePrefsJson: jsonb("voice_prefs_json"),
    examplePostsJson: jsonb("example_posts_json"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("projects_user_id_idx").on(table.userId),
  }),
);

export const strategyCycles = pgTable(
  "strategy_cycles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    weekStart: date("week_start", { mode: "date" }).notNull(),
    weekEnd: date("week_end", { mode: "date" }),
    source: strategySourceEnum("source").notNull().default("initial"),
    strategySummary: text("strategy_summary"),
    anglesJson: jsonb("angles_json").notNull().default(sql`'[]'::jsonb`),
    llmProvider: text("llm_provider"),
    llmModel: text("llm_model"),
    promptVersion: varchar("prompt_version", { length: 50 }),
    status: text("status").notNull().default("ready"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("strategy_cycles_project_id_idx").on(table.projectId),
    projectWeekUnique: uniqueIndex("strategy_cycles_project_week_unique").on(table.projectId, table.weekStart),
  }),
);

export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    strategyCycleId: uuid("strategy_cycle_id")
      .notNull()
      .references(() => strategyCycles.id, { onDelete: "cascade" }),
    parentContentItemId: uuid("parent_content_item_id").references((): any => contentItems.id, { onDelete: "set null" }),
    platform: platformEnum("platform").notNull().default("instagram"),
    contentType: contentTypeEnum("content_type").notNull().default("slideshow_video"),
    internalTitle: text("internal_title").notNull(),
    angle: text("angle").notNull(),
    hook: text("hook").notNull(),
    slidesJson: jsonb("slides_json").notNull().default(sql`'[]'::jsonb`),
    caption: text("caption").notNull(),
    hashtagsJson: jsonb("hashtags_json"),
    ctaText: text("cta_text").notNull(),
    destinationUrl: text("destination_url").notNull(),
    trackingSlug: varchar("tracking_slug", { length: 255 }).notNull(),
    templateId: text("template_id").notNull().default("clean_dark"),
    renderStatus: renderStatusEnum("render_status").notNull().default("pending"),
    publishStatus: publishStatusEnum("publish_status").notNull().default("draft"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    externalPostId: text("external_post_id"),
    externalPostUrl: text("external_post_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    strategyIdx: index("content_items_strategy_cycle_id_idx").on(table.strategyCycleId),
    trackingSlugUnique: uniqueIndex("content_items_tracking_slug_unique").on(table.trackingSlug),
    parentIdx: index("content_items_parent_content_item_id_idx").on(table.parentContentItemId),
    scheduledForIdx: index("content_items_scheduled_for_idx").on(table.scheduledFor),
    publishStatusIdx: index("content_items_publish_status_idx").on(table.publishStatus),
  }),
);

export const usageCounters = pgTable(
  "usage_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    periodType: usagePeriodTypeEnum("period_type").notNull(),
    periodStart: date("period_start", { mode: "date" }).notNull(),
    periodEnd: date("period_end", { mode: "date" }).notNull(),
    postsGenerated: integer("posts_generated").notNull().default(0),
    manualRegenerations: integer("manual_regenerations").notNull().default(0),
    videosRendered: integer("videos_rendered").notNull().default(0),
    postsPublished: integer("posts_published").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userProjectPeriodUnique: uniqueIndex("usage_counters_user_project_period_unique").on(
      table.userId,
      table.projectId,
      table.periodType,
      table.periodStart,
      table.periodEnd,
    ),
    userPeriodIdx: index("usage_counters_user_period_idx").on(table.userId, table.periodType, table.periodStart, table.periodEnd),
  }),
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    lemonSqueezySubscriptionId: text("lemon_squeezy_subscription_id"),
    lemonSqueezyCustomerId: text("lemon_squeezy_customer_id"),
    lemonSqueezyOrderId: text("lemon_squeezy_order_id"),
    lemonSqueezyProductId: text("lemon_squeezy_product_id"),
    lemonSqueezyVariantId: text("lemon_squeezy_variant_id"),
    managementUrl: text("management_url"),
    updatePaymentMethodUrl: text("update_payment_method_url"),
    providerStatus: text("provider_status"),
    status: subscriptionStatusEnum("status").notNull().default("incomplete"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("subscriptions_user_id_idx").on(table.userId),
    stripeSubscriptionUnique: uniqueIndex("subscriptions_stripe_subscription_id_unique")
      .on(table.stripeSubscriptionId)
      .where(sql`${table.stripeSubscriptionId} is not null`),
    lemonSubscriptionUnique: uniqueIndex("subscriptions_lemon_squeezy_subscription_id_unique")
      .on(table.lemonSqueezySubscriptionId)
      .where(sql`${table.lemonSqueezySubscriptionId} is not null`),
  }),
);

export const accessRequests = pgTable(
  "access_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    productName: text("product_name"),
    websiteUrl: text("website_url"),
    notes: text("notes"),
    status: accessRequestStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("access_requests_email_idx").on(table.email),
    statusCreatedIdx: index("access_requests_status_created_at_idx").on(table.status, table.createdAt),
  }),
);

export const contentAssets = pgTable(
  "content_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    assetType: assetTypeEnum("asset_type").notNull(),
    storageUrl: text("storage_url").notNull(),
    storagePath: text("storage_path"),
    durationSec: integer("duration_sec"),
    width: integer("width"),
    height: integer("height"),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contentItemIdx: index("content_assets_content_item_id_idx").on(table.contentItemId),
    contentItemAssetTypeIdx: index("content_assets_content_item_asset_type_idx").on(table.contentItemId, table.assetType),
    contentItemAssetTypeUnique: uniqueIndex("content_assets_content_item_asset_type_unique").on(
      table.contentItemId,
      table.assetType,
    ),
  }),
);

export const jobQueue = pgTable(
  "job_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: jobTypeEnum("type").notNull(),
    payloadJson: jsonb("payload_json").notNull().default(sql`'{}'::jsonb`),
    status: jobStatusEnum("status").notNull().default("pending"),
    runAt: timestamp("run_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusRunAtIdx: index("job_queue_status_run_at_idx").on(table.status, table.runAt),
    typeIdx: index("job_queue_type_idx").on(table.type),
  }),
);

export const clickEvents = pgTable(
  "click_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    trackingSlug: varchar("tracking_slug", { length: 255 }).notNull(),
    clickId: varchar("click_id", { length: 255 }).notNull(),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    countryCode: varchar("country_code", { length: 3 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clickIdUnique: uniqueIndex("click_events_click_id_unique").on(table.clickId),
    contentItemIdx: index("click_events_content_item_id_idx").on(table.contentItemId),
    createdAtIdx: index("click_events_created_at_idx").on(table.createdAt),
  }),
);

export const conversionEvents = pgTable(
  "conversion_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "set null" }),
    clickId: varchar("click_id", { length: 255 }),
    eventType: eventTypeEnum("event_type").notNull(),
    externalUserId: text("external_user_id"),
    value: integer("value"),
    currency: varchar("currency", { length: 10 }),
    metadataJson: jsonb("metadata_json"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clickIdIdx: index("conversion_events_click_id_idx").on(table.clickId),
  }),
);

export const revenueEvents = pgTable(
  "revenue_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "set null" }),
    clickId: varchar("click_id", { length: 255 }),
    source: revenueSourceEnum("source").notNull(),
    externalEventId: text("external_event_id"),
    customerId: text("customer_id"),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    eventName: text("event_name"),
    metadataJson: jsonb("metadata_json"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    clickIdIdx: index("revenue_events_click_id_idx").on(table.clickId),
    sourceExternalUnique: uniqueIndex("revenue_events_source_external_event_id_unique")
      .on(table.source, table.externalEventId)
      .where(sql`${table.externalEventId} is not null`),
  }),
);

export const performanceMetrics = pgTable(
  "performance_metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    signups: integer("signups").notNull().default(0),
    revenue: integer("revenue").notNull().default(0),
    ctr: integer("ctr").notNull().default(0),
    epc: integer("epc").notNull().default(0),
    score: integer("score").notNull().default(0),
    classification: text("classification"),
    lastCalculatedAt: timestamp("last_calculated_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contentItemUnique: uniqueIndex("performance_metrics_content_item_id_unique").on(table.contentItemId),
    projectIdx: index("performance_metrics_project_id_idx").on(table.projectId),
    scoreIdx: index("performance_metrics_score_idx").on(table.score),
  }),
);

export const iterationExperiments = pgTable(
  "iteration_experiments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    strategyCycleId: uuid("strategy_cycle_id").references(() => strategyCycles.id, { onDelete: "set null" }),
    winnerContentItemId: uuid("winner_content_item_id").references(() => contentItems.id, { onDelete: "set null" }),
    hypothesis: text("hypothesis"),
    mutationType: mutationTypeEnum("mutation_type").notNull(),
    inputSummary: text("input_summary"),
    resultSummary: text("result_summary"),
    status: iterationStatusEnum("status").notNull().default("draft"),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdx: index("iteration_experiments_project_id_idx").on(table.projectId),
    winnerIdx: index("iteration_experiments_winner_content_item_id_idx").on(table.winnerContentItemId),
    mutationIdx: index("iteration_experiments_mutation_type_idx").on(table.mutationType),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  subscriptions: many(subscriptions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  strategyCycles: many(strategyCycles),
  contentItems: many(contentItems),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const strategyCyclesRelations = relations(strategyCycles, ({ one, many }) => ({
  project: one(projects, { fields: [strategyCycles.projectId], references: [projects.id] }),
  contentItems: many(contentItems),
}));

export const contentItemsRelations = relations(contentItems, ({ one, many }) => ({
  project: one(projects, { fields: [contentItems.projectId], references: [projects.id] }),
  strategyCycle: one(strategyCycles, { fields: [contentItems.strategyCycleId], references: [strategyCycles.id] }),
  assets: many(contentAssets),
}));

export const contentAssetsRelations = relations(contentAssets, ({ one }) => ({
  contentItem: one(contentItems, { fields: [contentAssets.contentItemId], references: [contentItems.id] }),
}));
