import { NextResponse } from "next/server";
import { syncLemonSqueezySubscription, verifyLemonSqueezyWebhook } from "@/domains/billing/service";

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

    // Parse and sync - errors here should be retried
    try {
      const payload = JSON.parse(rawBody);
      const result = await syncLemonSqueezySubscription(payload);
      return NextResponse.json(result, { status: 200 });
    } catch (syncError) {
      console.error("[billing] lemonsqueezy_webhook_sync_failed", {
        error: syncError instanceof Error ? syncError.message : "Unknown error",
        payload: rawBody,
      });
      // Return 500 so LemonSqueezy retries
      return NextResponse.json(
        { error: "Subscription sync failed. Will retry." },
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

