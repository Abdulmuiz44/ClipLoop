import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getProjectPerformanceTotals } from "@/domains/performance/service";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const user = await getCurrentUser();

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const summary = await getProjectPerformanceTotals(projectId);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
