import { NextResponse } from "next/server";
import { syncLemonSqueezySubscription, verifyLemonSqueezyWebhook } from "@/domains/billing/service";

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    verifyLemonSqueezyWebhook(rawBody, request.headers.get("x-signature"));
    const payload = JSON.parse(rawBody);
    const result = await syncLemonSqueezySubscription(payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[billing] lemonsqueezy_webhook_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook failed" }, { status: 400 });
  }
}
