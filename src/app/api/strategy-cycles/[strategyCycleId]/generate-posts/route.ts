import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generatePostsForStrategyCycle } from "@/domains/content-items/service";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(_request: Request, context: { params: Promise<{ strategyCycleId: string }> }) {
  try {
    const { strategyCycleId } = await context.params;
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const cycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, strategyCycleId) });
    if (!cycle) return NextResponse.json({ error: "Strategy cycle not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, cycle.projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const posts = await generatePostsForStrategyCycle(strategyCycleId);
    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
