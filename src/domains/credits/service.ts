import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getPlanLimitsForUser } from "@/domains/account/service";

type CreditBucket = "generation" | "render";
type CreditReason =
  | "monthly_grant"
  | "action_generate_copy"
  | "action_generate_video_generation"
  | "action_generate_video_render"
  | "manual_adjustment";

type ChargeInput = {
  userId: string;
  bucket: CreditBucket;
  amount: number;
  reason: Exclude<CreditReason, "monthly_grant">;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
};

type WalletSummary = {
  generationBalance: number;
  renderBalance: number;
  periodKey: string;
};

export class InsufficientCreditsError extends Error {
  constructor(
    message: string,
    public readonly bucket: CreditBucket,
    public readonly required: number,
    public readonly available: number,
  ) {
    super(message);
  }
}

function getPeriodKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function createCreditAccountIfMissing(userId: string) {
  await db
    .insert(schema.creditAccounts)
    .values({ userId })
    .onConflictDoNothing({ target: schema.creditAccounts.userId });
}

export async function getOrCreateCreditAccount(userId: string) {
  await createCreditAccountIfMissing(userId);
  const account = await db.query.creditAccounts.findFirst({
    where: eq(schema.creditAccounts.userId, userId),
  });

  if (!account) {
    throw new Error("Could not initialize credit account.");
  }

  return account;
}

async function applyMonthlyGrantIfNeeded(userId: string, periodKey = getPeriodKey()) {
  const limits = await getPlanLimitsForUser(userId);
  const account = await getOrCreateCreditAccount(userId);
  const grants: Array<{ bucket: CreditBucket; amount: number }> = [
    { bucket: "generation", amount: limits.postsPerMonth },
    { bucket: "render", amount: limits.rendersPerMonth },
  ];

  await db.transaction(async (tx) => {
    const current = await tx.query.creditAccounts.findFirst({
      where: eq(schema.creditAccounts.id, account.id),
    });
    if (!current) throw new Error("Credit account missing during grant.");

    let nextGeneration = current.generationBalance;
    let nextRender = current.renderBalance;

    for (const grant of grants) {
      if (grant.amount <= 0) continue;

      const nextBalance =
        grant.bucket === "generation" ? nextGeneration + grant.amount : nextRender + grant.amount;
      const [entry] = await tx
        .insert(schema.creditLedgerEntries)
        .values({
          userId,
          creditAccountId: current.id,
          bucket: grant.bucket,
          direction: "credit",
          reason: "monthly_grant",
          amountDelta: grant.amount,
          balanceAfter: nextBalance,
          referenceType: "monthly_grant",
          referenceId: `${periodKey}:${grant.bucket}`,
          metadataJson: { periodKey, source: "plan_limits" },
        })
        .onConflictDoNothing({
          target: [schema.creditLedgerEntries.userId, schema.creditLedgerEntries.referenceType, schema.creditLedgerEntries.referenceId],
        })
        .returning();

      if (entry) {
        if (grant.bucket === "generation") {
          nextGeneration = nextBalance;
        } else {
          nextRender = nextBalance;
        }
      }
    }

    if (nextGeneration !== current.generationBalance || nextRender !== current.renderBalance) {
      await tx
        .update(schema.creditAccounts)
        .set({
          generationBalance: nextGeneration,
          renderBalance: nextRender,
          updatedAt: new Date(),
        })
        .where(eq(schema.creditAccounts.id, current.id));
    }
  });
}

export async function getCreditWalletSummary(userId: string): Promise<WalletSummary> {
  const periodKey = getPeriodKey();
  await applyMonthlyGrantIfNeeded(userId, periodKey);
  const account = await getOrCreateCreditAccount(userId);
  return {
    generationBalance: account.generationBalance,
    renderBalance: account.renderBalance,
    periodKey,
  };
}

export async function assertCanAffordAction(
  userId: string,
  costs: Array<{ bucket: CreditBucket; amount: number }>,
) {
  const wallet = await getCreditWalletSummary(userId);
  for (const cost of costs) {
    const available = cost.bucket === "generation" ? wallet.generationBalance : wallet.renderBalance;
    if (cost.amount > available) {
      throw new InsufficientCreditsError(
        `${cost.bucket === "generation" ? "Generation" : "Render"} credits are insufficient for this action.`,
        cost.bucket,
        cost.amount,
        available,
      );
    }
  }
}

export async function chargeCredits(input: ChargeInput) {
  if (input.amount <= 0) throw new Error("Charge amount must be positive.");

  await applyMonthlyGrantIfNeeded(input.userId);
  const account = await getOrCreateCreditAccount(input.userId);

  return db.transaction(async (tx) => {
    const current = await tx.query.creditAccounts.findFirst({
      where: eq(schema.creditAccounts.id, account.id),
    });
    if (!current) throw new Error("Credit account not found.");

    const currentBalance = input.bucket === "generation" ? current.generationBalance : current.renderBalance;
    if (currentBalance < input.amount) {
      throw new InsufficientCreditsError(
        `${input.bucket === "generation" ? "Generation" : "Render"} credits are insufficient for this action.`,
        input.bucket,
        input.amount,
        currentBalance,
      );
    }

    const nextBalance = currentBalance - input.amount;
    const [entry] = await tx
      .insert(schema.creditLedgerEntries)
      .values({
        userId: input.userId,
        creditAccountId: current.id,
        bucket: input.bucket,
        direction: "debit",
        reason: input.reason,
        amountDelta: -input.amount,
        balanceAfter: nextBalance,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
        metadataJson: input.metadata ?? {},
      })
      .returning();

    if (input.bucket === "generation") {
      await tx
        .update(schema.creditAccounts)
        .set({ generationBalance: nextBalance, updatedAt: new Date() })
        .where(eq(schema.creditAccounts.id, current.id));
    } else {
      await tx
        .update(schema.creditAccounts)
        .set({ renderBalance: nextBalance, updatedAt: new Date() })
        .where(eq(schema.creditAccounts.id, current.id));
    }

    return entry;
  });
}

export async function chargeGenerateCopyCredits(input: {
  userId: string;
  chatJobId?: string;
  contentItemId?: string;
}) {
  return chargeCredits({
    userId: input.userId,
    bucket: "generation",
    amount: 1,
    reason: "action_generate_copy",
    referenceType: "chat_job",
    referenceId: input.chatJobId ? `${input.chatJobId}:copy` : undefined,
    metadata: { chatJobId: input.chatJobId, contentItemId: input.contentItemId, action: "generate_copy" },
  });
}

export async function chargeGenerateVideoCredits(input: {
  userId: string;
  chatJobId?: string;
  contentItemId?: string;
}) {
  await applyMonthlyGrantIfNeeded(input.userId);
  const account = await getOrCreateCreditAccount(input.userId);

  return db.transaction(async (tx) => {
    const current = await tx.query.creditAccounts.findFirst({
      where: eq(schema.creditAccounts.id, account.id),
    });
    if (!current) throw new Error("Credit account not found.");
    if (current.generationBalance < 1) {
      throw new InsufficientCreditsError("Generation credits are insufficient for this action.", "generation", 1, current.generationBalance);
    }
    if (current.renderBalance < 1) {
      throw new InsufficientCreditsError("Render credits are insufficient for this action.", "render", 1, current.renderBalance);
    }

    const nextGeneration = current.generationBalance - 1;
    const nextRender = current.renderBalance - 1;
    const metadata = { chatJobId: input.chatJobId, contentItemId: input.contentItemId, action: "generate_video" };

    const [generation] = await tx
      .insert(schema.creditLedgerEntries)
      .values({
        userId: input.userId,
        creditAccountId: current.id,
        bucket: "generation",
        direction: "debit",
        reason: "action_generate_video_generation",
        amountDelta: -1,
        balanceAfter: nextGeneration,
        referenceType: "chat_job",
        referenceId: input.chatJobId ? `${input.chatJobId}:video:generation` : null,
        metadataJson: metadata,
      })
      .returning();

    const [render] = await tx
      .insert(schema.creditLedgerEntries)
      .values({
        userId: input.userId,
        creditAccountId: current.id,
        bucket: "render",
        direction: "debit",
        reason: "action_generate_video_render",
        amountDelta: -1,
        balanceAfter: nextRender,
        referenceType: "chat_job",
        referenceId: input.chatJobId ? `${input.chatJobId}:video:render` : null,
        metadataJson: metadata,
      })
      .returning();

    await tx
      .update(schema.creditAccounts)
      .set({
        generationBalance: nextGeneration,
        renderBalance: nextRender,
        updatedAt: new Date(),
      })
      .where(eq(schema.creditAccounts.id, current.id));

    return { generation, render };
  });
}

export async function listRecentCreditTransactions(userId: string, limit = 20) {
  await applyMonthlyGrantIfNeeded(userId);
  return db.query.creditLedgerEntries.findMany({
    where: eq(schema.creditLedgerEntries.userId, userId),
    orderBy: [desc(schema.creditLedgerEntries.createdAt)],
    limit,
  });
}

export function formatCreditReason(reason: CreditReason) {
  switch (reason) {
    case "monthly_grant":
      return "Monthly plan grant";
    case "action_generate_copy":
      return "Promo copy generation";
    case "action_generate_video_generation":
      return "Promo video copy generation";
    case "action_generate_video_render":
      return "Promo video rendering";
    case "manual_adjustment":
      return "Manual adjustment";
    default:
      return reason;
  }
}

export async function getCreditWalletWithRecentTransactions(userId: string) {
  const [wallet, transactions] = await Promise.all([getCreditWalletSummary(userId), listRecentCreditTransactions(userId, 12)]);
  return { wallet, transactions };
}
