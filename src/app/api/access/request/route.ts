import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { accessRequestInputSchema } from "@/lib/validation/billing";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
  try {
    const body = accessRequestInputSchema.parse(await request.json());
    const email = body.email.toLowerCase();
    const existing = await db.query.accessRequests.findFirst({
      where: and(eq(schema.accessRequests.email, email), eq(schema.accessRequests.status, "pending")),
    });

    if (existing) {
      return NextResponse.json({ request: existing, deduped: true }, { status: 200 });
    }

    const [row] = await db
      .insert(schema.accessRequests)
      .values({
        email,
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
