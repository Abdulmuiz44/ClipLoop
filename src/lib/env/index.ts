import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  MOCK_MODE: z.coerce.boolean().default(true),
  DEMO_USER_EMAIL: z.string().email().default("demo@cliploop.local"),
  MOCK_LLM: z.coerce.boolean().default(true),
  INVITE_ONLY_MODE: z.coerce.boolean().default(true),
  LLM_PROVIDER: z.string().default("mock"),
  LLM_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  LEMON_SQUEEZY_API_KEY: z.string().optional(),
  LEMON_SQUEEZY_STORE_ID: z.string().optional(),
  LEMON_SQUEEZY_STARTER_VARIANT_ID: z.string().optional(),
  LEMON_SQUEEZY_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  MOCK_MODE: process.env.MOCK_MODE,
  DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL,
  MOCK_LLM: process.env.MOCK_LLM,
  INVITE_ONLY_MODE: process.env.INVITE_ONLY_MODE,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  LLM_API_KEY: process.env.LLM_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  LEMON_SQUEEZY_API_KEY: process.env.LEMON_SQUEEZY_API_KEY,
  LEMON_SQUEEZY_STORE_ID: process.env.LEMON_SQUEEZY_STORE_ID,
  LEMON_SQUEEZY_STARTER_VARIANT_ID: process.env.LEMON_SQUEEZY_STARTER_VARIANT_ID,
  LEMON_SQUEEZY_WEBHOOK_SECRET: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
});
