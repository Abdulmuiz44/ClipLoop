import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const user = await getCurrentUser();

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const cycle = await db.query.strategyCycles.findFirst({
      where: and(eq(schema.strategyCycles.projectId, projectId), eq(schema.strategyCycles.source, "iteration")),
      orderBy: [desc(schema.strategyCycles.weekStart)],
    });

    return NextResponse.json({ nextCycle: cycle ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
