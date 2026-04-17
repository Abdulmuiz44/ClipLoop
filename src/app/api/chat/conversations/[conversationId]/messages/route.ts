import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { chatMessageCreateSchema } from "@/lib/validation/chat";
import { getConversationThread, sendChatMessageAndGenerate } from "@/domains/chat/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET(_request: Request, context: { params: Promise<{ conversationId: string }> }) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const { conversationId } = await context.params;
    const thread = await getConversationThread(user.id, conversationId);
    return NextResponse.json(thread, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ conversationId: string }> }) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const { conversationId } = await context.params;
    const payload = chatMessageCreateSchema.parse(await request.json());
    const result = await sendChatMessageAndGenerate({
      userId: user.id,
      conversationId,
      content: payload.content,
      mode: payload.mode,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
