"use client";

import { useState } from "react";

type Props = {
  projectId: string;
  label: string;
};

export function ChannelConnectButton({ projectId, label }: Props) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/projects/${projectId}/channels/connect`, { method: "POST" });
          const json = (await response.json()) as { authUrl?: string; error?: string };
          if (!response.ok || !json.authUrl) {
            throw new Error(json.error ?? "Failed to start Instagram connect flow");
          }
          window.location.href = json.authUrl;
        } catch (error) {
          window.alert(error instanceof Error ? error.message : "Failed to connect channel");
          setLoading(false);
        }
      }}
      className="inline-flex rounded border bg-white px-3 py-2 text-sm"
    >
      {loading ? "Starting Instagram connect..." : label}
    </button>
  );
}
