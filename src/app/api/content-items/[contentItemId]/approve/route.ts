import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";
import { db, schema } from "@/lib/db";
import { approveContentItem } from "@/domains/publishing/service";

export async function POST(_request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
    if (!item) return NextResponse.json({ error: "Content item not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const updatedItem = await approveContentItem(contentItemId);
    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    return toErrorResponse(error);
  }
}
