import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";
import { createApiKey, listApiKeys } from "@/domains/api-keys/service";

const createSchema = z.object({
  label: z.string().min(1).max(64),
  projectId: z.string().uuid().optional(),
  scopes: z.array(z.string().min(1)).optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const keys = await listApiKeys(user.id);
    return NextResponse.json({ keys }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const body = await req.json().catch(() => ({}));
    const input = createSchema.parse(body);

    const created = await createApiKey({
      userId: user.id,
      label: input.label,
      projectId: input.projectId ?? null,
      scopes: input.scopes,
    });

    // IMPORTANT: apiKey returned only once.
    return NextResponse.json(
      {
        apiKey: created.apiKey,
        apiKeyId: created.apiKeyId,
        keyPrefix: created.keyPrefix,
        label: created.label,
        scopes: created.scopes,
        createdAt: created.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
