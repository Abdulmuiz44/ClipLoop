import { NextResponse } from "next/server";
import { logTrackedClick } from "@/domains/tracking/service";

export async function GET(request: Request, context: { params: Promise<{ trackingSlug: string }> }) {
  try {
    const { trackingSlug } = await context.params;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? null;

    const result = await logTrackedClick({
      trackingSlug,
      referrer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      ip,
      countryCode: request.headers.get("x-vercel-ip-country") ?? null,
    });

    return NextResponse.redirect(result.redirectUrl, { status: 302 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Tracking link not found" }, { status: 404 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
