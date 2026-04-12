import { z, type ZodTypeAny } from "zod";
import { env } from "@/lib/env";

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

  throw new Error("Real LLM provider not implemented yet. Set MOCK_LLM=true.");
}

export async function generateText(prompt: string, mockText = "Mock text output") {
  if (env.MOCK_LLM || env.LLM_PROVIDER === "mock") {
    return `${mockText}\n\n[Deterministic mock for prompt hash: ${prompt.length}]`;
  }
  throw new Error("Real text generation provider not implemented yet.");
}
