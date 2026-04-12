import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById } from "@/domains/projects/service";
import { generateWeeklyStrategyForProject } from "@/domains/strategy/service";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const project = await getProjectById(projectId, user.id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const cycle = await generateWeeklyStrategyForProject(project);
    return NextResponse.json({ cycle }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
