import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { getLatestProjectMemory } from "@/domains/memory/service";
import { assembleProjectContext } from "@/domains/memory/assembler";
import { getProjectById } from "@/domains/projects/service";
import { toErrorResponse } from "@/lib/http/errors";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const project = await getProjectById(projectId, user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [snapshot, assembled, countResult] = await Promise.all([
      getLatestProjectMemory(projectId),
      assembleProjectContext({ projectId, mode: "debug" }),
      db
        .select({ count: count() })
        .from(schema.projectMemorySnapshots)
        .where(eq(schema.projectMemorySnapshots.projectId, projectId)),
    ]);

    return NextResponse.json({
      projectId,
      latestSnapshot: snapshot,
      assembledContext: assembled,
      snapshotCount: countResult[0]?.count ?? 0,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
