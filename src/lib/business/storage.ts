import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { BusinessProfile, PromoPack } from "./schemas";

const { businessProfiles, promoPacks } = schema;

function userScope(userId: string | null) {
  return userId ? eq(businessProfiles.userId, userId) : isNull(businessProfiles.userId);
}

export async function saveBusinessProfile(userId: string | null, profile: BusinessProfile, rawExtractedText?: string) {
  const [row] = await db
    .insert(businessProfiles)
    .values({ userId, ...profile, rawExtractedText: rawExtractedText ?? null })
    .returning();
  return row;
}

export async function listBusinessProfiles(userId: string | null) {
  return db.select().from(businessProfiles).where(userScope(userId)).orderBy(desc(businessProfiles.createdAt));
}

export async function getBusinessProfileForUser(id: string, userId: string | null) {
  const [row] = await db
    .select()
    .from(businessProfiles)
    .where(and(eq(businessProfiles.id, id), userScope(userId)))
    .limit(1);
  return row ?? null;
}

export async function updateBusinessProfile(id: string, userId: string | null, profile: BusinessProfile) {
  const [row] = await db
    .update(businessProfiles)
    .set({ ...profile, updatedAt: new Date() })
    .where(and(eq(businessProfiles.id, id), userScope(userId)))
    .returning();
  return row ?? null;
}

export async function deleteBusinessProfile(id: string, userId: string | null) {
  const [row] = await db
    .delete(businessProfiles)
    .where(and(eq(businessProfiles.id, id), userScope(userId)))
    .returning({ id: businessProfiles.id });
  return row ?? null;
}

export async function savePromoPack(userId: string | null, businessProfileId: string, pack: PromoPack) {
  const [row] = await db
    .insert(promoPacks)
    .values({ userId, businessProfileId, campaignTitle: pack.campaignTitle, positioningAngle: pack.positioningAngle, content: pack })
    .returning();
  return row;
}

export async function listPromoPacksForBusiness(profileId: string, userId: string | null) {
  return db
    .select()
    .from(promoPacks)
    .where(and(eq(promoPacks.businessProfileId, profileId), userId ? eq(promoPacks.userId, userId) : isNull(promoPacks.userId)))
    .orderBy(desc(promoPacks.createdAt));
}

export async function getPromoPackForUser(profileId: string, packId: string, userId: string | null) {
  const [row] = await db
    .select()
    .from(promoPacks)
    .where(and(eq(promoPacks.id, packId), eq(promoPacks.businessProfileId, profileId), userId ? eq(promoPacks.userId, userId) : isNull(promoPacks.userId)))
    .limit(1);
  return row ?? null;
}

export async function deletePromoPack(profileId: string, packId: string, userId: string | null) {
  const [row] = await db
    .delete(promoPacks)
    .where(and(eq(promoPacks.id, packId), eq(promoPacks.businessProfileId, profileId), userId ? eq(promoPacks.userId, userId) : isNull(promoPacks.userId)))
    .returning({ id: promoPacks.id });
  return row ?? null;
}

export async function getBusinessProfileWithPacksForUser(id: string, userId: string | null) {
  const profile = await getBusinessProfileForUser(id, userId);
  if (!profile) return null;
  const packs = await listPromoPacksForBusiness(id, userId);
  return { profile, packs };
}
