import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { runWeeklyPromoMvp } from "@/domains/weekly-promo/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const body = await request.json().catch(() => ({}));
    const result = await runWeeklyPromoMvp(body);
    return NextResponse.json({ result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
