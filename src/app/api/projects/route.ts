import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createProject } from "@/domains/projects/service";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const body = await request.json();
    const project = await createProject(user.id, body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
