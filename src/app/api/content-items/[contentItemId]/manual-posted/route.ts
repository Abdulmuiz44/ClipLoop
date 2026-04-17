import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { requireProductAccess } from "@/domains/account/service";
import { markContentItemManualPosted } from "@/domains/content-items/service";
import { markContentItemManualPostedBodySchema } from "@/lib/validation/content";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    markContentItemManualPostedBodySchema.parse(await request.json().catch(() => ({ posted: true })));
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
    if (!item) return NextResponse.json({ error: "Content item not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const updated = await markContentItemManualPosted(contentItemId);
    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
