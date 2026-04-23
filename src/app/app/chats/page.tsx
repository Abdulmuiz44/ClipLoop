import { StudioShell } from "@/components/app/studio-shell";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { getCurrentUser } from "@/lib/auth";
import { createConversationForUser, getConversationThread, listConversationsForUser } from "@/domains/chat/service";
import { getPrimaryProjectForUser } from "@/domains/context/service";
import { getDisplayPlanName, getPlanLimitsForUser, requireProductAccess } from "@/domains/account/service";
import { getCreditWalletSummary } from "@/domains/credits/service";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const user = await getCurrentUser();
  const accessState = await requireProductAccess(user.id);
  const primaryProject = await getPrimaryProjectForUser(user.id);

  if (!primaryProject) {
    return (
      <StudioShell title="Chats" subtitle="Set up a project to start chat-based generation.">
        <div className="cl-card p-6 text-sm text-slate-600">No project found yet. Create one first from Projects.</div>
      </StudioShell>
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
    <StudioShell title="Chats" subtitle="Use free chat for strategy or paid generation for copy/video.">
      <ChatWorkspace
        embedded
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
    </StudioShell>
  );
}
