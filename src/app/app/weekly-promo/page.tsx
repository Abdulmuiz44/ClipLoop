import { promises as fs } from "node:fs";
import path from "node:path";

import { StudioShell } from "@/components/app/studio-shell";
import { WeeklyPromoFlow } from "@/components/app/weekly-promo-flow";

export const dynamic = "force-dynamic";

type RecentWeeklyPromo = {
  id: string;
  createdAt: string;
  appName: string;
  channel: string;
  videoUrl: string;
  artifactUrl: string;
  inputSnapshot?: {
    appName?: string;
    appWebsiteUrl?: string;
    weeklyUpdate?: string;
    targetAudience?: string;
    callToAction?: string;
    channel?: "instagram" | "tiktok" | "whatsapp" | "x";
    tone?: string;
  } | null;
};

async function listRecentWeeklyPromos(limit = 6): Promise<RecentWeeklyPromo[]> {
  const baseDir = path.join(process.cwd(), "public", "generated", "weekly-promos");

  let ids: string[] = [];
  try {
    ids = await fs.readdir(baseDir);
  } catch {
    return [];
  }

  const items: Array<RecentWeeklyPromo | null> = await Promise.all(
    ids.map(async (id) => {
      try {
        const artifactPath = path.join(baseDir, id, "artifact.json");
        const raw = await fs.readFile(artifactPath, "utf8");
        const json = JSON.parse(raw) as {
          id?: string;
          createdAt?: string;
          input?: { appName?: string; channel?: string };
          inputSnapshot?: {
            appName?: string;
            appWebsiteUrl?: string;
            weeklyUpdate?: string;
            targetAudience?: string;
            callToAction?: string;
            channel?: "instagram" | "tiktok" | "whatsapp" | "x";
            tone?: string;
          };
          render?: { videoUrl?: string };
        };

        const createdAt = json.createdAt || new Date(0).toISOString();
        const safeId = json.id || id;

        return {
          id: safeId,
          createdAt,
          appName: json.inputSnapshot?.appName || json.input?.appName || "Unknown app",
          channel: json.inputSnapshot?.channel || json.input?.channel || "unknown",
          videoUrl: json.render?.videoUrl || `/generated/weekly-promos/${safeId}/video.mp4`,
          artifactUrl: `/generated/weekly-promos/${safeId}/artifact.json`,
          inputSnapshot: json.inputSnapshot || null,
        } satisfies RecentWeeklyPromo;
      } catch {
        return null;
      }
    }),
  );

  return items
    .filter((item): item is RecentWeeklyPromo => item !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export default async function WeeklyPromoPage() {
  const recentPromos = await listRecentWeeklyPromos();

  return (
    <StudioShell
      title="Weekly Promo"
      subtitle="Use product context + this week's update to generate one useful promo video fast."
    >
      <WeeklyPromoFlow recentPromos={recentPromos} />
    </StudioShell>
  );
}
