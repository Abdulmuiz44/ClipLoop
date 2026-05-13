import { NextResponse } from "next/server";
import { businessProfileSchema } from "@/lib/business/schemas";
import { generatePromoPack } from "@/lib/business/generatePromoPack";
import { savePromoPack } from "@/lib/business/storage";
import { getCurrentUser } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http/errors";
export async function POST(req:Request){try{const body=await req.json();const profile=businessProfileSchema.parse(body.profile ?? body);const pack=await generatePromoPack(profile);const user=await getCurrentUser();const saved=body.businessProfileId?await savePromoPack(user?.id ?? null, body.businessProfileId, pack):null;return NextResponse.json({ promoPack: pack, savedPromoPack: saved });}catch(error){return toErrorResponse(error);}}
