import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { renderContentItemBodySchema } from "@/lib/validation/render";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";
import { getGatewayRenderExecutor } from "@/gateway";

export async function POST(request: Request, context: { params: Promise<{ contentItemId: string }> }) {
  try {
    const { contentItemId } = await context.params;
    const body = renderContentItemBodySchema.parse(await request.json().catch(() => ({})));

    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const item = await db.query.contentItems.findFirst({ where: eq(schema.contentItems.id, contentItemId) });
    if (!item) return NextResponse.json({ error: "Content item not found" }, { status: 404 });

    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, item.projectId) });
    if (!project || project.userId !== user.id) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const renderResult = await getGatewayRenderExecutor().execute({
      contentItemId,
      renderer: body.renderer,
      targetChannel: body.targetChannel,
    });

    if (renderResult.status === "failed") {
      const errorMessage = renderResult.error ?? "Render failed";
      if (errorMessage.includes("ffmpeg")) {
        return NextResponse.json({ error: errorMessage, code: "FFMPEG_MISSING" }, { status: 503 });
      }
      if (errorMessage.includes("HyperFrames CLI binary")) {
        return NextResponse.json({ error: errorMessage, code: "HYPERFRAMES_MISSING" }, { status: 503 });
      }
      if (errorMessage.includes("HyperFrames renderer is disabled")) {
        return NextResponse.json({ error: errorMessage, code: "HYPERFRAMES_DISABLED" }, { status: 400 });
      }
      throw new Error(errorMessage);
    }

    return NextResponse.json({ result: renderResult.result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
