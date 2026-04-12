"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button type="button" onClick={copy} className="px-2 py-1 text-xs">
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
