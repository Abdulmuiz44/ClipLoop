import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { accessRequestInputSchema } from "@/lib/validation/billing";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
  try {
    const body = accessRequestInputSchema.parse(await request.json());
    const [row] = await db
      .insert(schema.accessRequests)
      .values({
        email: body.email.toLowerCase(),
        name: body.name ?? null,
        productName: body.productName ?? null,
        websiteUrl: body.websiteUrl ?? null,
        notes: body.notes ?? null,
      })
      .returning();

    return NextResponse.json({ request: row }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
