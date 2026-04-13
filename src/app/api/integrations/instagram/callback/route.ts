import { NextResponse } from "next/server";
import { connectInstagramFromCallback } from "@/domains/channels/service";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard/settings?channel_error=${encodeURIComponent(error)}`, env.NEXT_PUBLIC_APP_URL));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard/settings?channel_error=Missing+callback+parameters", env.NEXT_PUBLIC_APP_URL));
  }

  try {
    const channel = await connectInstagramFromCallback({ code, state });
    return NextResponse.redirect(new URL(`/dashboard/projects/${channel.projectId}?channel_connected=instagram`, env.NEXT_PUBLIC_APP_URL));
  } catch (callbackError) {
    const message = callbackError instanceof Error ? callbackError.message : "Instagram connection failed";
    return NextResponse.redirect(new URL(`/dashboard/settings?channel_error=${encodeURIComponent(message)}`, env.NEXT_PUBLIC_APP_URL));
  }
}
