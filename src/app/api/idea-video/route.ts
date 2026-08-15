import { NextResponse } from "next/server";

import { requireProductAccess } from "@/domains/account/service";
import { runIdeaVideoMvp } from "@/domains/idea-video/service";
import { getCurrentUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ result: await runIdeaVideoMvp(body) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
