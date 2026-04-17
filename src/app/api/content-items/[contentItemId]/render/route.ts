import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { renderContentItem } from "@/domains/rendering/service";
import { renderContentItemBodySchema } from "@/lib/validation/render";
import { FfmpegUnavailableError } from "@/lib/render/ffmpeg";
import { requireProductAccess } from "@/domains/account/service";
import { toErrorResponse } from "@/lib/http/errors";
import { HyperframesDisabledError } from "@/lib/render/adapters/hyperframes";
import { HyperframesUnavailableError } from "@/lib/render/hyperframes/cli";

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

    const result = await renderContentItem(contentItemId, {
      templateId: body.templateId,
      renderer: body.renderer,
      targetChannel: body.targetChannel,
    });
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof FfmpegUnavailableError) {
      return NextResponse.json({ error: error.message, code: "FFMPEG_MISSING" }, { status: 503 });
    }
    if (error instanceof HyperframesUnavailableError) {
      return NextResponse.json({ error: error.message, code: "HYPERFRAMES_MISSING" }, { status: 503 });
    }
    if (error instanceof HyperframesDisabledError) {
      return NextResponse.json({ error: error.message, code: "HYPERFRAMES_DISABLED" }, { status: 400 });
    }

    return toErrorResponse(error);
  }
}
