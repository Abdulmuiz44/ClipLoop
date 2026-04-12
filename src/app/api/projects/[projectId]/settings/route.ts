import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { updateProjectSettings } from "@/domains/projects/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await context.params;
    const user = await getCurrentUser();
    await requireProductAccess(user.id);

    const body = await request.json();
    const project = await updateProjectSettings(projectId, user.id, body);
    return NextResponse.json({ project }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
