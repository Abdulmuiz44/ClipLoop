import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getJobsForStrategyCycle } from "@/domains/publishing/service";

export async function GET(_request: Request, context: { params: Promise<{ strategyCycleId: string }> }) {
  try {
    const { strategyCycleId } = await context.params;
    const user = await getCurrentUser();

    const cycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
    if (!cycle) return NextResponse.json({ error: "Strategy cycle not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, cycle.projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const jobs = await getJobsForStrategyCycle(strategyCycleId);
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
