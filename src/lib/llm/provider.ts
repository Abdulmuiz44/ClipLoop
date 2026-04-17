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

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
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
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Mistral request failed (${response.status}): ${text.slice(0, 400)}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Mistral returned empty response.");
    }
    return content;
  }
}

export function getChatProvider(): ChatProvider {
  if (env.MOCK_LLM || env.LLM_PROVIDER === "mock") {
    return new MockChatProvider();
  }
  if (env.LLM_PROVIDER === "mistral") {
    return new MistralChatProvider();
  }
  throw new Error(`Unsupported LLM provider: ${env.LLM_PROVIDER}`);
}
