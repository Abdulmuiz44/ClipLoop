import { NextResponse } from "next/server";
import { syncLemonSqueezySubscription, syncLemonSqueezyOrder, verifyLemonSqueezyWebhook } from "@/domains/billing/service";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    // Signature verification - reject if invalid (don't retry)
    try {
      verifyLemonSqueezyWebhook(rawBody, request.headers.get("x-signature"));
    } catch (error) {
      console.error("[billing] lemonsqueezy_webhook_verification_failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 401 },
      );
    }

    // Parse body to determine event type
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const eventName = (payload as any)?.meta?.event_name ?? "";
    const dataType = (payload as any)?.data?.type ?? "";

    try {
      if (dataType === "orders" || eventName === "order_created") {
        const result = await syncLemonSqueezyOrder(payload as any);
        return NextResponse.json(result, { status: 200 });
      }

      // Default: try subscription sync (handles subscription_* events)
      const result = await syncLemonSqueezySubscription(payload as any);
      return NextResponse.json(result, { status: 200 });
    } catch (syncError) {
      console.error("[billing] lemonsqueezy_webhook_sync_failed", {
        error: syncError instanceof Error ? syncError.message : "Unknown error",
        eventName,
        dataType,
      });
      // Return 500 so LemonSqueezy retries
      return NextResponse.json(
        { error: "Webhook sync failed. Will retry." },
        { status: 500 },
      );
    }
  } catch (error) {
    // Fallback for any unexpected errors
    console.error("[billing] lemonsqueezy_webhook_unexpected_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

