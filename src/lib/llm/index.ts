import { z, type ZodTypeAny } from "zod";
import { env } from "@/lib/env";
import { getChatProvider, type ChatMessage } from "@/lib/llm/provider";

type GenerateStructuredInput<TSchema extends ZodTypeAny> = {
  schema: TSchema;
  prompt: string;
  mockFactory: () => z.infer<TSchema>;
};

export async function generateStructuredObject<TSchema extends ZodTypeAny>(
  input: GenerateStructuredInput<TSchema>,
): Promise<z.infer<TSchema>> {
  if (env.MOCK_LLM || env.LLM_PROVIDER === "mock") {
    return input.schema.parse(input.mockFactory());
  }

  const provider = getChatProvider();
  const jsonPrompt = [
    "Return valid JSON only. Do not wrap in markdown.",
    "The JSON must satisfy this schema description:",
    input.schema.toString(),
    "Task:",
    input.prompt,
  ].join("\n\n");

  const text = await provider.generateText({
    messages: [{ role: "user", content: jsonPrompt }],
    temperature: 0.2,
    maxTokens: 1200,
  });

  const parsed = safeParseJson(text);
  return input.schema.parse(parsed);
}

export async function generateText(prompt: string, mockText = "Mock text output") {
  if (env.MOCK_LLM || env.LLM_PROVIDER === "mock") {
    return `${mockText}\n\n[Deterministic mock for prompt hash: ${prompt.length}]`;
  }
  const provider = getChatProvider();
  const messages: ChatMessage[] = [{ role: "user", content: prompt }];
  return provider.generateText({ messages, temperature: 0.35, maxTokens: 1000 });
}

function safeParseJson(raw: string) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("LLM response was not valid JSON.");
  }
}
