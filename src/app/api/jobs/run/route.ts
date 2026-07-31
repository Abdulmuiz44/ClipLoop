import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processDueJobs } from "@/domains/publishing/service";
import { runJobsBodySchema } from "@/lib/validation/publishing";
import { toErrorResponse } from "@/lib/http/errors";
import { env } from "@/lib/env";

function hasValidSchedulerSecret(request: Request) {
  const secret = env.SCHEDULER_SECRET;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !token) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  try {
    if (!hasValidSchedulerSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = runJobsBodySchema.parse(await request.json().catch(() => ({})));
    const result = await processDueJobs(body.limit);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
