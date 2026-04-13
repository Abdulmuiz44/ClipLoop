import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { toErrorResponse } from "@/lib/http/errors";
import { getProjectChannelStatus } from "@/domains/channels/service";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await getCurrentUser();
    const { projectId } = await context.params;

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, projectId) });
    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const status = await getProjectChannelStatus(project.id);
    return NextResponse.json(status);
  } catch (error) {
    return toErrorResponse(error);
  }
}
