import type { BillingActionId } from "@/core/billing/policy";
import type { CoreChannel } from "@/core/types/channels";
import type { RenderBackend } from "@/core/render/contracts";

export type GatewayCapability =
  | "orchestrate.generate"
  | "orchestrate.render"
  | "orchestrate.publish"
  | "providers.use"
  | "credits.charge";

export type GatewayIdentity = {
  mode: "session_user" | "api_key";
  actorId: string;
  projectId?: string;
  capabilities: GatewayCapability[];
};

export interface GatewayAuth {
  authenticate(input: { apiKey?: string | null; userId?: string | null }): Promise<GatewayIdentity | null>;
}

export interface GatewayCreditGuard {
  preflight(input: { userId: string; action: BillingActionId; units?: number }): Promise<{ allowed: boolean; reason?: string }>;
  commit(input: {
    userId: string;
    action: BillingActionId;
    referenceType: string;
    referenceId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export interface GatewayProviderAccess {
  resolve(input: { provider: "mistral"; userId?: string }): Promise<{ provider: "mistral"; mode: "local" | "managed" }>;
}

export interface GatewayRenderExecutor {
  execute(input: {
    contentItemId: string;
    renderer?: RenderBackend;
    targetChannel?: CoreChannel;
  }): Promise<{ status: "completed" | "failed"; error?: string }>;
}

export interface GatewayOrchestrator {
  generateCopy(input: { userId: string; prompt: string; projectId?: string }): Promise<{ text: string }>;
  generateVideo(input: { userId: string; contentItemId: string }): Promise<{ status: "queued" | "completed" }>;
  publish(input: { userId: string; contentItemId: string; scheduledFor?: Date }): Promise<{ status: "scheduled" | "published" }>;
}

