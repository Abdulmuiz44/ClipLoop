import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { requireProductAccess } from "@/domains/account/service";
import { updateContentItemPublishStrategy } from "@/domains/content-items/service";
import { updateContentItemPublishStrategyBodySchema } from "@/lib/validation/content";
import { toErrorResponse } from "@/lib/http/errors";

export async function PATCH(request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    const body = updateContentItemPublishStrategyBodySchema.parse(await request.json());
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
    if (!item) return NextResponse.json({ error: "Content item not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const updated = await updateContentItemPublishStrategy(contentItemId, body.publishStrategy);
    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
