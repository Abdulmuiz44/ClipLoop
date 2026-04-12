import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { regenerateSingleContentItem } from "@/domains/content-items/service";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(_request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const existing = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
    if (!existing) return NextResponse.json({ error: "Content item not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, existing.projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const post = await regenerateSingleContentItem(contentItemId);
    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
