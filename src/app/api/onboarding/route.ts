import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { onboardingInputSchema } from "@/lib/validation/chat";
import { completeOnboarding } from "@/domains/context/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const parsed = onboardingInputSchema.parse(await request.json());
    const result = await completeOnboarding(user.id, parsed);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
