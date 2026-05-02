import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deletePromoPack, getPromoPackForUser } from "@/lib/business/storage";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; packId: string }> }) {
  try {
    const { id, packId } = await params;
    const user = await getCurrentUser();
    const pack = await getPromoPackForUser(id, packId, user?.id ?? null);
    if (!pack) return NextResponse.json({ error: "Promo pack not found." }, { status: 404 });
    return NextResponse.json({ pack });
  } catch (error) { return toErrorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; packId: string }> }) {
  try {
    const { id, packId } = await params;
    const user = await getCurrentUser();
    const deleted = await deletePromoPack(id, packId, user?.id ?? null);
    if (!deleted) return NextResponse.json({ error: "Promo pack not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) { return toErrorResponse(error); }
}
