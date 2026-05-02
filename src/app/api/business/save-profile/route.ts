import { NextResponse } from "next/server";
import { businessProfileSchema } from "@/lib/business/schemas";
import { saveBusinessProfile } from "@/lib/business/storage";
import { getCurrentUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http/errors";
export async function POST(req: Request) {try{const body=await req.json();const parsed=businessProfileSchema.parse(body.profile ?? body);const user=await getCurrentUser();const saved=await saveBusinessProfile(user?.id ?? null, parsed, body.rawExtractedText);return NextResponse.json({ profile: saved }, { status: 201 });}catch(error){return toErrorResponse(error);}}
