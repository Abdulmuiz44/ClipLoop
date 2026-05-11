import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listBusinessProfiles } from "@/lib/business/storage";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const profiles = await listBusinessProfiles(user?.id ?? null);
    return NextResponse.json({ profiles });
  } catch (error) {
    return toErrorResponse(error);
  }
}
