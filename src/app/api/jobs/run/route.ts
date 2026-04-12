import { NextResponse } from "next/server";
import { processDueJobs } from "@/domains/publishing/service";
import { runJobsBodySchema } from "@/lib/validation/publishing";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const body = runJobsBodySchema.parse(await request.json().catch(() => ({})));
    const result = await processDueJobs(body.limit);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
