import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  MOCK_MODE: z.coerce.boolean().default(true),
  DEMO_USER_EMAIL: z.string().email().default("demo@cliploop.local"),
  MOCK_LLM: z.coerce.boolean().default(true),
  INVITE_ONLY_MODE: z.coerce.boolean().default(true),
  LLM_PROVIDER: z.string().default("mock"),
  LLM_API_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  MOCK_MODE: process.env.MOCK_MODE,
  DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL,
  MOCK_LLM: process.env.MOCK_LLM,
  INVITE_ONLY_MODE: process.env.INVITE_ONLY_MODE,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  LLM_API_KEY: process.env.LLM_API_KEY,
});
