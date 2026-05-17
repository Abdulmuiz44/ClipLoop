import { getBillingPolicy } from "@/core/billing/policy";
import type {
  GatewayAuth,
  GatewayCreditGuard,
  GatewayIdentity,
  GatewayOrchestrator,
  GatewayProviderAccess,
  GatewayRenderExecutor,
} from "@/gateway/contracts";
import type { BillingActionId } from "@/core/billing/policy";

class LocalGatewayAuth implements GatewayAuth {
  async authenticate(input: { apiKey?: string | null; userId?: string | null }): Promise<GatewayIdentity | null> {
    if (input.userId) {
      return {
        mode: "session_user",
        actorId: input.userId,
        capabilities: ["orchestrate.generate", "orchestrate.render", "orchestrate.publish", "providers.use", "credits.charge"],
      };
    }

    // TODO(hosted-gateway): replace with API-key backed identity resolution.
    if (input.apiKey) return null;
    return null;
  }
}

class LocalGatewayCreditGuard implements GatewayCreditGuard {
  async preflight(input: { userId: string; action: BillingActionId; units?: number }) {
    const policy = getBillingPolicy(input.action);
    if (!policy.billable) return { allowed: true };
    const { assertCanAffordAction } = await import("@/domains/credits/service");
    await assertCanAffordAction(input.userId, [{ bucket: policy.bucket, amount: policy.amount * (input.units ?? 1) }]);
    return { allowed: true };
  }

  async commit(input: {
    userId: string;
    action: BillingActionId;
    referenceType: string;
    referenceId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const policy = getBillingPolicy(input.action);
    if (!policy.billable) return;
    const { chargeCredits } = await import("@/domains/credits/service");
    await chargeCredits({
      userId: input.userId,
      bucket: policy.bucket,
      amount: policy.amount,
      reason: policy.reason,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      metadata: input.metadata,
    });
  }
}

class LocalGatewayProviderAccess implements GatewayProviderAccess {
  async resolve(input: { provider: "mistral"; userId?: string }) {
    // TODO(hosted-gateway): route provider traffic through managed provider credentials/quota.
    return { provider: input.provider, mode: "local" as const };
  }
}

class LocalGatewayRenderExecutor implements GatewayRenderExecutor {
  async execute(input: { contentItemId: string; renderer?: "legacy" | "hyperframes"; targetChannel?: "instagram" | "tiktok" | "whatsapp" }) {
    const { renderContentItem } = await import("@/domains/rendering/service");
    try {
      const result = await renderContentItem(input.contentItemId, {
        renderer: input.renderer,
        targetChannel: input.targetChannel,
      });
      return { status: "completed" as const, result };
    } catch (error) {
      return { status: "failed" as const, error: error instanceof Error ? error.message : "render failed" };
    }
  }
}

class LocalGatewayOrchestrator implements GatewayOrchestrator {
  async generateStrategy(input: { userId: string; projectId: string }) {
    const { getProjectById } = await import("@/domains/projects/service");
    const { generateWeeklyStrategyForProject } = await import("@/domains/strategy/service");
    const project = await getProjectById(input.projectId, input.userId);
    if (!project) {
      throw new Error("Project not found");
    }
    const cycle = await generateWeeklyStrategyForProject(project);
    return { cycle };
  }

  async generatePosts(input: { userId: string; strategyCycleId: string }) {
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const { generatePostsForStrategyCycle } = await import("@/domains/content-items/service");
    const cycle = await db.query.strategyCycles.findFirst({ where: eq(schema.strategyCycles.id, input.strategyCycleId) });
    if (!cycle) {
      throw new Error("Strategy cycle not found");
    }
    const project = await db.query.projects.findFirst({ where: eq(schema.projects.id, cycle.projectId) });
    if (!project || project.userId !== input.userId) {
      throw new Error("Project not found");
    }
    const posts = await generatePostsForStrategyCycle(input.strategyCycleId);
    return { posts };
  }

  async generateCopy(input: { userId: string; prompt: string; projectId?: string }) {
    const { generateText } = await import("@/lib/llm");
    const text = await generateText(input.prompt);
    return { text };
  }

  async generateVideo(input: { userId: string; contentItemId: string }) {
    const executor = getGatewayRenderExecutor();
    await executor.execute({ contentItemId: input.contentItemId });
    return { status: "completed" as const };
  }

  async publish(input: { userId: string; contentItemId: string; scheduledFor?: Date }) {
    if (input.scheduledFor) {
      await this.schedulePublish({
        userId: input.userId,
        contentItemId: input.contentItemId,
        scheduledFor: input.scheduledFor,
      });
      return { status: "scheduled" as const };
    }
    const { publishNow } = await import("@/gateway/local-publish-now");
    await publishNow(input.contentItemId);
    return { status: "published" as const };
  }

  async schedulePublish(input: { userId: string; contentItemId: string; scheduledFor: Date }) {
    const { scheduleContentItem } = await import("@/domains/publishing/service");
    return scheduleContentItem(input.contentItemId, input.scheduledFor);
  }
}

export function getGatewayAuth(): GatewayAuth {
  return new LocalGatewayAuth();
}

export function getGatewayCreditGuard(): GatewayCreditGuard {
  return new LocalGatewayCreditGuard();
}

export function getGatewayProviderAccess(): GatewayProviderAccess {
  return new LocalGatewayProviderAccess();
}

export function getGatewayRenderExecutor(): GatewayRenderExecutor {
  return new LocalGatewayRenderExecutor();
}

export function getGatewayOrchestrator(): GatewayOrchestrator {
  return new LocalGatewayOrchestrator();
}
