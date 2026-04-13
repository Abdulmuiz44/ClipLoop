"use client";

import { useState } from "react";

type Props = {
  projectId: string;
};

export function ChannelDisconnectButton({ projectId }: Props) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/projects/${projectId}/channels/disconnect`, { method: "POST" });
          const json = (await response.json()) as { error?: string };
          if (!response.ok) {
            throw new Error(json.error ?? "Failed to disconnect channel");
          }
          window.location.reload();
        } catch (error) {
          window.alert(error instanceof Error ? error.message : "Failed to disconnect channel");
          setLoading(false);
        }
      }}
      className="inline-flex rounded border bg-white px-3 py-2 text-sm"
    >
      {loading ? "Disconnecting..." : "Disconnect"}
    </button>
  );
}
