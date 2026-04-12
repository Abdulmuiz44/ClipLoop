import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";
import { db, schema } from "@/lib/db";
import { approveStrategyCycleContent } from "@/domains/publishing/service";

export async function POST(_request: Request, context: { params: Promise<{ strategyCycleId: string }> }) {
  try {
    const { strategyCycleId } = await context.params;
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const cycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
    if (!cycle) return NextResponse.json({ error: "Strategy cycle not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, cycle.projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const summary = await approveStrategyCycleContent(strategyCycleId);
    return NextResponse.json(summary);
  } catch (error) {
    return toErrorResponse(error);
  }
}
