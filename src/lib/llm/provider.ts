import { env } from "@/lib/env";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface ChatProvider {
  generateText(input: {
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;
}

class MockChatProvider implements ChatProvider {
  async generateText(input: { messages: ChatMessage[] }): Promise<string> {
    const prompt = input.messages.map((m) => `${m.role}:${m.content}`).join("\n");
    return `Mock response for prompt length ${prompt.length}`;
  }
}

class MistralChatProvider implements ChatProvider {
  async generateText(input: { messages: ChatMessage[]; temperature?: number; maxTokens?: number }): Promise<string> {
    if (!env.MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is required when LLM_PROVIDER=mistral.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    let response: Response;
    try {
      response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.MISTRAL_MODEL,
          messages: input.messages,
          temperature: input.temperature ?? 0.2,
          max_tokens: input.maxTokens ?? 900,
          response_format: { type: "text" },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Mistral request failed (${response.status}): ${text.slice(0, 400)}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?:
            | string
            | Array<{
                type?: string;
                text?: string;
              }>;
        };
      }>;
    };
    const content = json.choices?.[0]?.message?.content;
    const resolvedContent = resolveMistralMessageContent(content);
    if (!resolvedContent) {
      throw new Error("Mistral returned empty response.");
    }
    return resolvedContent;
  }
}

function resolveMistralMessageContent(
  content:
    | string
    | Array<{
        type?: string;
        text?: string;
      }>
    | undefined,
) {
  if (!content) return "";
  if (typeof content === "string") return content;

  const textParts = content
    .map((chunk) => {
      if (!chunk || typeof chunk !== "object") return "";
      if (chunk.type === "text" && typeof chunk.text === "string") return chunk.text;
      if (typeof chunk.text === "string") return chunk.text;
      return "";
    })
    .filter(Boolean);
  return textParts.join("\n").trim();
}

export function getChatProvider(): ChatProvider {
  if (env.LLM_PROVIDER === "mistral") {
    return new MistralChatProvider();
  }
  if (env.LLM_PROVIDER === "mock" || env.MOCK_LLM) {
    return new MockChatProvider();
  }
  throw new Error(`Unsupported LLM provider: ${env.LLM_PROVIDER}`);
}
