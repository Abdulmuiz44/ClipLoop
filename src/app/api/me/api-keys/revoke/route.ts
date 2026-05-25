import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { revokeApiKey } from "@/domains/api-keys/service";
import { toErrorResponse } from "@/lib/http/errors";

const schema = z.object({ apiKeyId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const body = await req.json().catch(() => ({}));
    const input = schema.parse(body);

    const result = await revokeApiKey({ userId: user.id, apiKeyId: input.apiKeyId });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
