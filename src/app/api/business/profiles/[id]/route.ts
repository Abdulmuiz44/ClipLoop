import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { businessProfileSchema } from "@/lib/business/schemas";
import { deleteBusinessProfile, getBusinessProfileWithPacksForUser, updateBusinessProfile } from "@/lib/business/storage";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const data = await getBusinessProfileWithPacksForUser(id, user?.id ?? null);
    if (!data) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) { return toErrorResponse(error); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const profile = businessProfileSchema.parse(body.profile ?? body);
    const user = await getCurrentUser();
    const updated = await updateBusinessProfile(id, user?.id ?? null, profile);
    if (!updated) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    return NextResponse.json({ profile: updated });
  } catch (error) { return toErrorResponse(error); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const deleted = await deleteBusinessProfile(id, user?.id ?? null);
    if (!deleted) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) { return toErrorResponse(error); }
}
