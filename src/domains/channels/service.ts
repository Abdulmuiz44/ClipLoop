import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { decryptText, encryptText } from "@/lib/security/encryption";

const FACEBOOK_GRAPH_VERSION = "v19.0";
const FACEBOOK_OAUTH_URL = `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth`;
const GRAPH_API_BASE = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}`;

export type ChannelHealthStatus = "active" | "expired" | "invalid" | "disconnected";

export class InstagramConfigError extends Error {
  constructor() {
    super("Instagram integration is not configured. Set INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI, and ENCRYPTION_SECRET.");
  }
}

function requireInstagramConfig() {
  if (!env.INSTAGRAM_CLIENT_ID || !env.INSTAGRAM_CLIENT_SECRET || !env.INSTAGRAM_REDIRECT_URI || !env.ENCRYPTION_SECRET) {
    throw new InstagramConfigError();
  }
}

type OAuthStatePayload = {
  projectId: string;
  userId: string;
  nonce: string;
  issuedAt: number;
};

function encodeState(payload: OAuthStatePayload) {
  return encryptText(JSON.stringify(payload));
}

function decodeState(token: string): OAuthStatePayload {
  const json = decryptText(token);
  const parsed = JSON.parse(json) as OAuthStatePayload;

  if (!parsed.projectId || !parsed.userId || !parsed.issuedAt) {
    throw new Error("Invalid OAuth state payload");
  }

  const maxAgeMs = 15 * 60 * 1000;
  if (Date.now() - parsed.issuedAt > maxAgeMs) {
    throw new Error("OAuth state expired");
  }

  return parsed;
}

async function graphFetch<T>(path: string, token: string, init?: RequestInit) {
  const url = new URL(`${GRAPH_API_BASE}${path}`);
  if (!init?.method || init.method === "GET") {
    url.searchParams.set("access_token", token);
  }

  const response = await fetch(url.toString(), {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: init?.body,
  });

  const json = (await response.json().catch(() => null)) as T | { error?: { message?: string } } | null;
  if (!response.ok) {
    const message =
      json && typeof json === "object" && "error" in json && json.error?.message
        ? json.error.message
        : `Instagram Graph request failed (${response.status})`;
    throw new Error(message);
  }

  return json as T;
}

export function getInstagramConnectUrl(projectId: string, userId: string) {
  requireInstagramConfig();

  const state = encodeState({
    projectId,
    userId,
    nonce: randomBytes(8).toString("hex"),
    issuedAt: Date.now(),
  });

  const url = new URL(FACEBOOK_OAUTH_URL);
  url.searchParams.set("client_id", env.INSTAGRAM_CLIENT_ID!);
  url.searchParams.set("redirect_uri", env.INSTAGRAM_REDIRECT_URI!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set(
    "scope",
    ["instagram_basic", "instagram_content_publish", "pages_show_list", "business_management"].join(","),
  );

  return url.toString();
}

type FacebookTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
};

type FacebookPagesResponse = {
  data?: Array<{ id: string; name: string; access_token?: string }>;
};

type InstagramBusinessResponse = {
  instagram_business_account?: {
    id?: string;
    username?: string;
  };
};

export async function connectInstagramFromCallback(input: { code: string; state: string }) {
  requireInstagramConfig();
  const state = decodeState(input.state);

  const tokenUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", env.INSTAGRAM_CLIENT_ID!);
  tokenUrl.searchParams.set("client_secret", env.INSTAGRAM_CLIENT_SECRET!);
  tokenUrl.searchParams.set("redirect_uri", env.INSTAGRAM_REDIRECT_URI!);
  tokenUrl.searchParams.set("code", input.code);

  const tokenResponse = await fetch(tokenUrl.toString(), { cache: "no-store" });
  const tokenJson = (await tokenResponse.json()) as FacebookTokenResponse | { error?: { message?: string } };
  if (!tokenResponse.ok || !("access_token" in tokenJson)) {
    const message = "error" in tokenJson ? tokenJson.error?.message ?? "Failed to exchange Instagram OAuth token" : "Failed to exchange Instagram OAuth token";
    throw new Error(message);
  }

  const token = tokenJson.access_token;
  const pages = await graphFetch<FacebookPagesResponse>("/me/accounts", token);
  const page = pages.data?.[0];

  let accountId: string | null = null;
  let accountName: string | null = null;

  if (page?.id) {
    const pageDetail = await graphFetch<InstagramBusinessResponse>(`/${page.id}?fields=instagram_business_account{id,username}`, token);
    accountId = pageDetail.instagram_business_account?.id ?? null;
    accountName = pageDetail.instagram_business_account?.username ?? page.name ?? null;
  }

  const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, state.projectId) });
  if (!project || project.userId !== state.userId) {
    throw new Error("Invalid project state for Instagram callback");
  }

  const existing = await getProjectChannel(state.projectId, "instagram");

  const values = {
    projectId: state.projectId,
    platform: "instagram" as const,
    accountName,
    accountId,
    accessTokenEncrypted: encryptText(token),
    refreshTokenEncrypted: null,
    tokenExpiresAt: tokenJson.expires_in ? new Date(Date.now() + tokenJson.expires_in * 1000) : null,
    metadataJson: {
      tokenType: tokenJson.token_type,
      pageId: page?.id ?? null,
      pageName: page?.name ?? null,
      connectedAt: new Date().toISOString(),
    },
    isActive: true,
    updatedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db
      .update(schema.connectedChannels)
      .set(values)
      .where(eq(schema.connectedChannels.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(schema.connectedChannels).values(values).returning();
  return created;
}

export async function getProjectChannel(projectId: string, platform: "instagram" | "tiktok" = "instagram") {
  return db.query.connectedChannels.findFirst({
    where: and(eq(schema.connectedChannels.projectId, projectId), eq(schema.connectedChannels.platform, platform)),
    orderBy: [desc(schema.connectedChannels.updatedAt)],
  });
}

export function getChannelHealth(channel: typeof schema.connectedChannels.$inferSelect | null): {
  status: ChannelHealthStatus;
  reason: string;
} {
  if (!channel || !channel.isActive) {
    return { status: "disconnected", reason: "No active channel connected." };
  }

  if (!channel.accessTokenEncrypted) {
    return { status: "invalid", reason: "Channel token is missing." };
  }

  if (channel.tokenExpiresAt && channel.tokenExpiresAt.getTime() <= Date.now()) {
    return { status: "expired", reason: "Channel access token is expired." };
  }

  return { status: "active", reason: "Channel is ready for publishing." };
}

export async function getProjectChannelStatus(projectId: string) {
  const channel = await getProjectChannel(projectId, "instagram");
  const health = getChannelHealth(channel ?? null);

  return {
    connected: !!channel,
    channel,
    status: health.status,
    reason: health.reason,
    isReady: health.status === "active",
  };
}

export async function disconnectProjectChannel(projectId: string, platform: "instagram" | "tiktok" = "instagram") {
  const channel = await getProjectChannel(projectId, platform);
  if (!channel) return null;

  const [updated] = await db
    .update(schema.connectedChannels)
    .set({
      isActive: false,
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      updatedAt: new Date(),
      metadataJson: {
        ...(channel.metadataJson as Record<string, unknown> | null),
        disconnectedAt: new Date().toISOString(),
      },
    })
    .where(eq(schema.connectedChannels.id, channel.id))
    .returning();

  return updated;
}

export function decryptChannelAccessToken(channel: typeof schema.connectedChannels.$inferSelect) {
  if (!channel.accessTokenEncrypted) {
    throw new Error("Channel token is missing");
  }
  return decryptText(channel.accessTokenEncrypted);
}
