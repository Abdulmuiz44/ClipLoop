import { NextResponse } from "next/server";
import { extractWebsiteText } from "@/lib/business/extractWebsiteText";
import { analyzeBusiness } from "@/lib/business/analyzeBusiness";
import { toErrorResponse } from "@/lib/http/errors";

export async function POST(req: Request) {
  try {
    const { websiteUrl } = await req.json();
    if (!websiteUrl || typeof websiteUrl !== "string") return NextResponse.json({ error: "websiteUrl is required." }, { status: 400 });
    const extracted = await extractWebsiteText(websiteUrl);
    const profile = await analyzeBusiness(extracted);
    return NextResponse.json({ profile, extractedText: extracted.extractedText });
  } catch (error) { return toErrorResponse(error); }
}
