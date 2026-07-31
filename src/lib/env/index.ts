import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .preprocess((v) => {
      if (typeof v !== "string") return v;
      return v.trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    }, z.string().min(1))
    .default("postgres://postgres:***@localhost:5432/cliplane"),
  // NOTE: z.coerce.boolean() treats any non-empty string (including "false") as true.
  // We need explicit string parsing for env vars.
  MOCK_MODE: z
    .preprocess((v) => {
      if (typeof v !== "string") return v;
      // Strip surrounding quotes (Render stores "false" as "\"false\"")
      const s = v.trim().replace(/^"|"$/g, "").toLowerCase();
      if (s === "true") return true;
      if (s === "false") return false;
      return v;
    }, z.boolean())
    .default(true),
  DEMO_USER_EMAIL: z.string().email().default("cliplaneapp@gmail.com"),
  MOCK_LLM: z.coerce.boolean().default(false),
  INVITE_ONLY_MODE: z.coerce.boolean().default(true),
  AUTH_SECRET: z.string().optional(),
  AUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AUTH_TWITTER_ID: z.string().optional(),
  AUTH_TWITTER_SECRET: z.string().optional(),
  LLM_PROVIDER: z.enum(["mistral", "openai", "mock"]).default("mistral"),
  LLM_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL: z.string().default("mistral-small-latest"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  LEMON_SQUEEZY_API_KEY: z.string().optional(),
  LEMON_SQUEEZY_STORE_ID: z.string().optional(),
  LEMON_SQUEEZY_STARTER_VARIANT_ID: z.string().optional(),
  LEMON_SQUEEZY_WEBHOOK_SECRET: z.string().optional(),
  CREDIT_PACK_STARTER_CHECKOUT_URL: z.string().url().optional(),
  CREDIT_PACK_PRO_CHECKOUT_URL: z.string().url().optional(),
  CREDIT_PACK_RENDER_CHECKOUT_URL: z.string().url().optional(),
  INSTAGRAM_CLIENT_ID: z.string().optional(),
  INSTAGRAM_CLIENT_SECRET: z.string().optional(),
  INSTAGRAM_REDIRECT_URI: z.string().url().optional(),
  ENCRYPTION_SECRET: z.string().optional(),
  HYPERFRAMES_ENABLED: z.coerce.boolean().default(false),
  HYPERFRAMES_BIN: z.string().default("hyperframes"),
  SCHEDULER_SECRET: z.string().min(1).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_CHANNEL_ID: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  MOCK_MODE: process.env.MOCK_MODE,
  DEMO_USER_EMAIL: "cliplaneapp@gmail.com",
  MOCK_LLM: process.env.MOCK_LLM,
  INVITE_ONLY_MODE: process.env.INVITE_ONLY_MODE,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  AUTH_TWITTER_ID: process.env.AUTH_TWITTER_ID,
  AUTH_TWITTER_SECRET: process.env.AUTH_TWITTER_SECRET,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  LLM_API_KEY: process.env.LLM_API_KEY,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  MISTRAL_MODEL: process.env.MISTRAL_MODEL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  LEMON_SQUEEZY_API_KEY: process.env.LEMON_SQUEEZY_API_KEY,
  LEMON_SQUEEZY_STORE_ID: process.env.LEMON_SQUEEZY_STORE_ID,
  LEMON_SQUEEZY_STARTER_VARIANT_ID: process.env.LEMON_SQUEEZY_STARTER_VARIANT_ID,
  LEMON_SQUEEZY_WEBHOOK_SECRET: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
  CREDIT_PACK_STARTER_CHECKOUT_URL: process.env.CREDIT_PACK_STARTER_CHECKOUT_URL,
  CREDIT_PACK_PRO_CHECKOUT_URL: process.env.CREDIT_PACK_PRO_CHECKOUT_URL,
  CREDIT_PACK_RENDER_CHECKOUT_URL: process.env.CREDIT_PACK_RENDER_CHECKOUT_URL,
  INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
  INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
  INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
  ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  HYPERFRAMES_ENABLED: process.env.HYPERFRAMES_ENABLED,
  HYPERFRAMES_BIN: process.env.HYPERFRAMES_BIN,
  SCHEDULER_SECRET: process.env.SCHEDULER_SECRET,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
});
