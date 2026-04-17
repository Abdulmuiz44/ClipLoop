import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireProductAccess } from "@/domains/account/service";
import { createConversationSchema } from "@/lib/validation/chat";
import { createConversationForUser, listConversationsForUser } from "@/domains/chat/service";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const conversations = await listConversationsForUser(user.id);
    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    await requireProductAccess(user.id);
    const payload = createConversationSchema.parse(await request.json().catch(() => ({})));
    const conversation = await createConversationForUser(user.id, payload);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
