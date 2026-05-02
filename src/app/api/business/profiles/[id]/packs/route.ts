import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generatePromoPack } from "@/lib/business/generatePromoPack";
import { businessProfileSchema } from "@/lib/business/schemas";
import { getBusinessProfileForUser, listPromoPacksForBusiness, savePromoPack } from "@/lib/business/storage";
import { toErrorResponse } from "@/lib/http/errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const profile = await getBusinessProfileForUser(id, user?.id ?? null);
    if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    const packs = await listPromoPacksForBusiness(id, user?.id ?? null);
    return NextResponse.json({ packs });
  } catch (error) { return toErrorResponse(error); }
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const profile = await getBusinessProfileForUser(id, user?.id ?? null);
    if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    const sanitizedProfile = businessProfileSchema.parse({
      websiteUrl: profile.websiteUrl, businessName: profile.businessName ?? "", industry: profile.industry ?? "", targetAudience: profile.targetAudience ?? "",
      mainOffer: profile.mainOffer ?? "", productsOrServices: Array.isArray(profile.productsOrServices) ? profile.productsOrServices : [],
      keyBenefits: Array.isArray(profile.keyBenefits) ? profile.keyBenefits : [], painPointsSolved: Array.isArray(profile.painPointsSolved) ? profile.painPointsSolved : [],
      brandTone: profile.brandTone ?? "", contentAngles: Array.isArray(profile.contentAngles) ? profile.contentAngles : [], ctaIdeas: Array.isArray(profile.ctaIdeas) ? profile.ctaIdeas : [],
      oneLineSummary: profile.oneLineSummary ?? "", longSummary: profile.longSummary ?? "",
    });
    const pack = await generatePromoPack(sanitizedProfile);
    const savedPromoPack = await savePromoPack(user?.id ?? null, id, pack);
    return NextResponse.json({ promoPack: pack, savedPromoPack }, { status: 201 });
  } catch (error) { return toErrorResponse(error); }
}
