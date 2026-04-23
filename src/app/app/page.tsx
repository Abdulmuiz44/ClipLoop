import { getCurrentUser } from "@/lib/auth";
import { getDisplayPlanName, getPlanLimitsForUser, requireProductAccess } from "@/domains/account/service";
import { createConversationForUser, getConversationThread, listConversationsForUser } from "@/domains/chat/service";
import { getPrimaryProjectForUser } from "@/domains/context/service";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { OnboardingForm } from "@/components/chat/onboarding-form";
import { getCreditWalletSummary } from "@/domains/credits/service";

export const dynamic = "force-dynamic";

export default async function ChatAppPage() {
  const user = await getCurrentUser();
  const accessState = await requireProductAccess(user.id);

  const primaryProject = await getPrimaryProjectForUser(user.id);
  if (!primaryProject) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="cl-card p-6 md:p-8 text-center">
          <p className="cl-kicker">Welcome to ClipLoop</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Set up your brand to start creating</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Complete your business profile once, then use the chat workspace to generate, render, and package short form promo content for your channels.
          </p>
        </div>
        <OnboardingForm />
      </div>
    );
  }

  let conversations = await listConversationsForUser(user.id);
  if (conversations.length === 0) {
    await createConversationForUser(user.id, { projectId: primaryProject.id, title: "New chat" });
    conversations = await listConversationsForUser(user.id);
  }

  const active = conversations[0]!;
  const thread = await getConversationThread(user.id, active.id);
  const [wallet, limits] = await Promise.all([getCreditWalletSummary(user.id), getPlanLimitsForUser(user.id)]);

  return (
    <ChatWorkspace
      initialConversations={conversations.map((conversation) => ({
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      }))}
      initialConversationId={active.id}
      initialMessages={thread.messages.map((message) => ({
        ...message,
        metadataJson: (message.metadataJson as Record<string, unknown> | null) ?? {},
        createdAt: message.createdAt.toISOString(),
      }))}
      creditSummary={{
        planLabel: getDisplayPlanName(accessState.effectivePlan).toUpperCase(),
        generationRemaining: wallet.generationBalance,
        generationLimit: limits.postsPerMonth,
        renderRemaining: wallet.renderBalance,
        renderLimit: limits.rendersPerMonth,
      }}
    />
  );
}
