import crypto from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";

type InternalSubscriptionStatus = "incomplete" | "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "paused" | "expired";

type BillingIdentityInput = {
  userId?: string | null;
  email: string;
  fullName?: string | null;
};

type LemonCheckoutResponse = {
  data?: {
    attributes?: {
      url?: string;
      test_mode?: boolean;
    };
  };
};

type LemonSubscriptionPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
      plan?: string;
    };
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      store_id?: number;
      customer_id?: number;
      order_id?: number;
      product_id?: number;
      variant_id?: number;
      user_name?: string | null;
      user_email?: string | null;
      status?: string | null;
      cancelled?: boolean | null;
      trial_ends_at?: string | null;
      renews_at?: string | null;
      ends_at?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
      urls?: {
        customer_portal?: string | null;
        update_payment_method?: string | null;
      } | null;
    };
  };
};

export class BillingConfigurationError extends Error {
  constructor(message = "Lemon Squeezy billing is not configured.") {
    super(message);
  }
}

export class BillingPortalError extends Error {
  constructor(message = "No active Lemon Squeezy subscription is available for billing management.") {
    super(message);
  }
}

const STARTER_ACCESS_STATUSES: InternalSubscriptionStatus[] = ["trialing", "active", "past_due", "unpaid", "canceled", "paused"];

export function isLemonSqueezyConfigured() {
  return !!(
    env.LEMON_SQUEEZY_API_KEY &&
    env.LEMON_SQUEEZY_STORE_ID &&
    env.LEMON_SQUEEZY_STARTER_VARIANT_ID &&
    env.LEMON_SQUEEZY_WEBHOOK_SECRET
  );
}

function requireLemonSqueezyEnv() {
  if (!isLemonSqueezyConfigured()) {
    throw new BillingConfigurationError(
      "Missing Lemon Squeezy configuration. Set LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, LEMON_SQUEEZY_STARTER_VARIANT_ID, and LEMON_SQUEEZY_WEBHOOK_SECRET.",
    );
  }
}

function buildAppUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

export function mapLemonStatus(status?: string | null): InternalSubscriptionStatus {
  switch (status) {
    case "on_trial":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "cancelled":
      return "canceled";
    case "paused":
      return "paused";
    case "expired":
      return "expired";
    default:
      return "incomplete";
  }
}

export function subscriptionConfersStarterAccess(subscription?: { status: string; currentPeriodEnd: Date | null } | null) {
  if (!subscription) return false;
  if (!STARTER_ACCESS_STATUSES.includes(subscription.status as InternalSubscriptionStatus)) {
    return false;
  }

  if (!subscription.currentPeriodEnd) {
    return true;
  }

  return subscription.currentPeriodEnd.getTime() >= Date.now();
}

function parseIsoDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function resolveCurrentPeriodStart(attributes: NonNullable<LemonSubscriptionPayload["data"]>["attributes"]) {
  return parseIsoDate(attributes?.updated_at) ?? parseIsoDate(attributes?.created_at);
}

function resolveCurrentPeriodEnd(attributes: NonNullable<LemonSubscriptionPayload["data"]>["attributes"], internalStatus: InternalSubscriptionStatus) {
  if (internalStatus === "trialing") {
    return parseIsoDate(attributes?.trial_ends_at) ?? parseIsoDate(attributes?.renews_at) ?? parseIsoDate(attributes?.ends_at);
  }

  return parseIsoDate(attributes?.ends_at) ?? parseIsoDate(attributes?.renews_at) ?? parseIsoDate(attributes?.trial_ends_at);
}

function deriveUserStateFromSubscription(user: typeof schema.users.$inferSelect, internalStatus: InternalSubscriptionStatus, currentPeriodEnd: Date | null) {
  const paidAccess = subscriptionConfersStarterAccess({ status: internalStatus, currentPeriodEnd });

  if (paidAccess) {
    return {
      plan: "starter" as const,
      billingStatus: internalStatus,
    };
  }

  if (user.isBetaApproved) {
    return {
      plan: "beta" as const,
      billingStatus: "beta_access",
    };
  }

  return {
    plan: "free" as const,
    billingStatus: internalStatus === "expired" ? "expired" : "none",
  };
}

async function lemonsqueezyFetch<T>(path: string, init?: RequestInit) {
  requireLemonSqueezyEnv();

  const response = await fetch(`https://api.lemonsqueezy.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${env.LEMON_SQUEEZY_API_KEY}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const message =
      json && typeof json === "object" && "errors" in json ? JSON.stringify((json as { errors: unknown }).errors) : `Lemon Squeezy request failed: ${response.status}`;
    throw new Error(message);
  }

  return json;
}

export async function getOrCreateBillingUser(input: BillingIdentityInput) {
  const normalizedEmail = input.email.trim().toLowerCase();

  if (input.userId) {
    const existingById = await db.query.users.findFirst({ where: eq(schema.users.id, input.userId) });
    if (existingById) {
      if ((input.fullName && !existingById.fullName) || normalizedEmail !== existingById.email) {
        const [updated] = await db
          .update(schema.users)
          .set({
            email: normalizedEmail,
            fullName: existingById.fullName ?? input.fullName ?? null,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existingById.id))
          .returning();
        return updated;
      }

      return existingById;
    }
  }

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, normalizedEmail) });
  if (existing) {
    if (input.fullName && !existing.fullName) {
      const [updated] = await db
        .update(schema.users)
        .set({ fullName: input.fullName, updatedAt: new Date() })
        .where(eq(schema.users.id, existing.id))
        .returning();
      return updated;
    }

    return existing;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      email: normalizedEmail,
      fullName: input.fullName ?? null,
      plan: "free",
      billingStatus: "checkout_started",
    })
    .returning();

  return created;
}

export async function createStarterCheckout(input: BillingIdentityInput) {
  const user = await getOrCreateBillingUser(input);

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: user.email,
          name: user.fullName ?? input.fullName ?? undefined,
          custom: {
            user_id: user.id,
            plan: "starter",
          },
        },
        checkout_options: {
          embed: false,
        },
        product_options: {
          redirect_url: buildAppUrl("/billing/success"),
          receipt_button_text: "Open ClipLoop",
          receipt_link_url: buildAppUrl("/dashboard/settings"),
        },
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: env.LEMON_SQUEEZY_STORE_ID!,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: env.LEMON_SQUEEZY_STARTER_VARIANT_ID!,
          },
        },
      },
    },
  };

  const response = await lemonsqueezyFetch<LemonCheckoutResponse>("/v1/checkouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const url = response?.data?.attributes?.url;
  if (!url) {
    throw new Error("Lemon Squeezy checkout URL was missing from the response.");
  }

  await db
    .update(schema.users)
    .set({
      billingStatus: "checkout_started",
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  return { url, user };
}

function verifyWebhookSignature(rawBody: string, signature: string) {
  const digest = Buffer.from(crypto.createHmac("sha256", env.LEMON_SQUEEZY_WEBHOOK_SECRET!).update(rawBody).digest("hex"), "utf8");
  const providedSignature = Buffer.from(signature, "utf8");

  if (digest.length !== providedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, providedSignature);
}

export function verifyLemonSqueezyWebhook(rawBody: string, signature: string | null) {
  requireLemonSqueezyEnv();

  if (!signature) {
    throw new Error("Missing Lemon Squeezy webhook signature.");
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new Error("Invalid Lemon Squeezy webhook signature.");
  }
}

function isSubscriptionPayload(payload: LemonSubscriptionPayload) {
  return payload?.data?.type === "subscriptions" && !!payload?.data?.id && !!payload?.data?.attributes?.user_email;
}

export async function syncLemonSqueezySubscription(payload: LemonSubscriptionPayload) {
  if (!isSubscriptionPayload(payload)) {
    return { ignored: true as const };
  }

  const eventName = payload.meta?.event_name ?? "subscription_updated";
  const attributes = payload.data!.attributes!;
  const lemonSubscriptionId = String(payload.data!.id);
  const internalStatus = mapLemonStatus(attributes.status);
  const existingSubscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.lemonSqueezySubscriptionId, lemonSubscriptionId),
  });
  const currentPeriodStart = existingSubscription?.currentPeriodStart ?? resolveCurrentPeriodStart(attributes);
  const currentPeriodEnd = resolveCurrentPeriodEnd(attributes, internalStatus);
  const email = attributes.user_email!.trim().toLowerCase();
  const user = await getOrCreateBillingUser({
    userId: payload.meta?.custom_data?.user_id ?? null,
    email,
    fullName: attributes.user_name ?? null,
  });

  const userState = deriveUserStateFromSubscription(user, internalStatus, currentPeriodEnd);

  await db
    .update(schema.users)
    .set({
      email,
      fullName: user.fullName ?? attributes.user_name ?? null,
      lemonSqueezyCustomerId: attributes.customer_id ? String(attributes.customer_id) : user.lemonSqueezyCustomerId,
      plan: userState.plan,
      billingStatus: userState.billingStatus,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  const values = {
    userId: user.id,
    lemonSqueezySubscriptionId: lemonSubscriptionId,
    lemonSqueezyCustomerId: attributes.customer_id ? String(attributes.customer_id) : null,
    lemonSqueezyOrderId: attributes.order_id ? String(attributes.order_id) : null,
    lemonSqueezyProductId: attributes.product_id ? String(attributes.product_id) : null,
    lemonSqueezyVariantId: attributes.variant_id ? String(attributes.variant_id) : null,
    managementUrl: attributes.urls?.customer_portal ?? null,
    updatePaymentMethodUrl: attributes.urls?.update_payment_method ?? null,
    providerStatus: attributes.status ?? null,
    status: internalStatus,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: !!attributes.cancelled,
    updatedAt: new Date(),
  };

  await db
    .insert(schema.subscriptions)
    .values({
      ...values,
      createdAt: existingSubscription?.createdAt ?? new Date(),
    })
    .onConflictDoUpdate({
      target: schema.subscriptions.lemonSqueezySubscriptionId,
      set: values,
    });

  console.info("[billing] synced_lemonsqueezy_subscription", {
    eventName,
    userId: user.id,
    lemonSubscriptionId,
    status: internalStatus,
    paidAccess: subscriptionConfersStarterAccess({ status: internalStatus, currentPeriodEnd }),
  });

  return {
    ignored: false as const,
    userId: user.id,
    lemonSubscriptionId,
    status: internalStatus,
  };
}

export async function getLatestSubscriptionForUser(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
    orderBy: (table) => [desc(table.updatedAt), desc(table.createdAt)],
  });
}

export async function refreshBillingManagementUrl(userId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: and(eq(schema.subscriptions.userId, userId), or(eq(schema.subscriptions.status, "active"), eq(schema.subscriptions.status, "trialing"), eq(schema.subscriptions.status, "past_due"), eq(schema.subscriptions.status, "unpaid"), eq(schema.subscriptions.status, "canceled"), eq(schema.subscriptions.status, "paused"))),
    orderBy: (table) => [desc(table.updatedAt), desc(table.createdAt)],
  });

  if (!subscription?.lemonSqueezySubscriptionId) {
    throw new BillingPortalError();
  }

  const response = await lemonsqueezyFetch<LemonSubscriptionPayload>(`/v1/subscriptions/${subscription.lemonSqueezySubscriptionId}`);
  const attributes = response.data?.attributes;
  const managementUrl = attributes?.urls?.customer_portal ?? subscription.managementUrl;
  const updatePaymentMethodUrl = attributes?.urls?.update_payment_method ?? subscription.updatePaymentMethodUrl;

  await db
    .update(schema.subscriptions)
    .set({
      managementUrl,
      updatePaymentMethodUrl,
      providerStatus: attributes?.status ?? subscription.providerStatus,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.id, subscription.id));

  if (!managementUrl) {
    throw new BillingPortalError();
  }

  return {
    url: managementUrl,
    subscriptionId: subscription.id,
  };
}
