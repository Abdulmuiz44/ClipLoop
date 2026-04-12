import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { toErrorResponse } from "@/lib/http/errors";

const bodySchema = z.object({ email: z.string().email(), plan: z.enum(["beta", "starter"]).default("beta") });

export async function POST(request: Request) {
  try {
    if (!env.MOCK_MODE) {
      return NextResponse.json({ error: "Dev-only route" }, { status: 403 });
    }

    const body = bodySchema.parse(await request.json());
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, body.email.toLowerCase()) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [updated] = await db
      .update(schema.users)
      .set({
        isBetaApproved: true,
        betaApprovedAt: new Date(),
        plan: body.plan,
        billingStatus: body.plan === "starter" ? "active" : "beta_access",
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))
      .returning();

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
