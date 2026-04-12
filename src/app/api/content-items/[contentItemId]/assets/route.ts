import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getAssetsForContentItem } from "@/domains/rendering/service";

export async function GET(_request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    const user = await getCurrentUser();

    const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
    if (!item) return NextResponse.json({ error: "Content item not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const assets = await getAssetsForContentItem(contentItemId);
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
