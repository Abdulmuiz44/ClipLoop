import { z } from 'zod'
import { generateStructuredObject } from '@/lib/llm'
import { env } from '@/lib/env'

// ─── Schemas ────────────────────────────────────────────────────────────

export const briefInputSchema = z.object({
  productName: z.string().min(1).max(200),
  update: z.string().min(1).max(2000),
  audience: z.string().max(500).optional(),
  tone: z.string().max(100).optional(),
  platform: z.string().max(50).optional(),
})

export const briefResultSchema = z.object({
  title: z.string(),
  angle: z.string(),
  hook: z.string(),
  keyPoints: z.array(z.string()).min(1).max(8),
  cta: z.string(),
})

export const scriptInputSchema = z.object({
  briefId: z.string().min(1),
  style: z.string().max(100).optional(),
})

export const scriptResultSchema = z.object({
  hook: z.string(),
  script: z.string(),
  scenes: z.array(z.object({
    title: z.string(),
    duration: z.number(),
    description: z.string(),
  })).default([]),
  caption: z.string(),
  hashtags: z.array(z.string()).default([]),
})

export const renderInputSchema = z.object({
  scriptId: z.string().min(1),
  format: z.enum(['portrait', 'landscape', 'square']).optional(),
  quality: z.enum(['draft', 'standard', 'high']).optional(),
})

export const campaignCreateInputSchema = z.object({
  name: z.string().min(1).max(200),
  platform: z.string().min(1).max(50),
  schedule: z.string().max(200).optional(),
})

export const campaignPackageInputSchema = z.object({
  campaignId: z.string().min(1),
})

// ─── Context ────────────────────────────────────────────────────────────

export interface EngineContext {
  requestId: string
  keyType: 'talocode' | 'cliploop_legacy'
  action: string
  credits: number
  mode: 'hosted'
  idempotencyKey: string
}

// ─── Engine Functions ──────────────────────────────────────────────────

function isMockMode(): boolean {
  const provider = process.env.LLM_PROVIDER ?? env.LLM_PROVIDER
  const mockLlm = process.env.MOCK_LLM ?? String(env.MOCK_LLM)
  return provider === 'mock' || mockLlm === 'true'
}

export async function generateBrief(
  input: z.infer<typeof briefInputSchema>,
  ctx: EngineContext,
): Promise<z.infer<typeof briefResultSchema>> {
  const mock = () => ({
    title: `${input.productName}: ${input.update.slice(0, 60)}`,
    angle: `We just shipped ${input.update.split('.')[0] || input.update.slice(0, 40)} and it changes everything for ${input.audience || 'our users'}.`,
    hook: `Big news from ${input.productName}: ${input.update.slice(0, 80)}`,
    keyPoints: [
      input.update,
      ...(input.audience ? [`Built for ${input.audience}`] : []),
      `${input.productName} continues to ship at speed.`,
    ].slice(0, 5),
    cta: `Try ${input.productName} today.`,
  })

  if (isMockMode()) {
    return briefResultSchema.parse(mock())
  }

  return generateStructuredObject({
    schema: briefResultSchema,
    mockFactory: mock,
    prompt: [
      'Generate a creative video brief for a product launch update.',
      `Product: ${input.productName}`,
      `Update: ${input.update}`,
      ...(input.audience ? [`Target audience: ${input.audience}`] : []),
      ...(input.tone ? [`Tone: ${input.tone}`] : []),
      ...(input.platform ? [`Platform: ${input.platform}`] : []),
      'Return: title, angle, hook, keyPoints (1-8 items), cta.',
      'Keep the hook short and punchy.',
    ].join('\n'),
  })
}

export async function generateScript(
  input: z.infer<typeof scriptInputSchema>,
  ctx: EngineContext,
): Promise<z.infer<typeof scriptResultSchema>> {
  const mock = () => ({
    hook: `Here's what's new.`,
    script: `Scene 1: Open with the hook.\nScene 2: Explain what changed.\nScene 3: Show the benefit.\nScene 4: Call to action.`,
    scenes: [
      { title: 'Hook', duration: 3, description: 'Open with the hook line.' },
      { title: 'Update', duration: 5, description: 'Explain what changed and why it matters.' },
      { title: 'Benefit', duration: 4, description: 'Show the key benefit for the audience.' },
      { title: 'CTA', duration: 3, description: 'Prompt viewers to take action.' },
    ],
    caption: `Check out the latest update.`,
    hashtags: ['#update', '#product', '#launch', '#buildinpublic'],
  })

  if (isMockMode()) {
    return scriptResultSchema.parse(mock())
  }

  return generateStructuredObject({
    schema: scriptResultSchema,
    mockFactory: mock,
    prompt: [
      'Generate a short video script.',
      `Brief ID: ${input.briefId}`,
      ...(input.style ? [`Style: ${input.style}`] : []),
      'Return: hook, full script text, scenes array (each with title, duration in seconds, description), caption, hashtags.',
      'Keep the video under 30 seconds total.',
    ].join('\n'),
  })
}

export async function renderVideo(
  input: z.infer<typeof renderInputSchema>,
  ctx: EngineContext,
): Promise<{
  renderId: string
  status: 'queued' | 'provider_required' | 'failed'
  estimatedSeconds?: number
  message?: string
}> {
  const hasRenderProvider = (process.env.REMOTION_RENDER_ENABLED ?? String(env.REMOTION_RENDER_ENABLED)) === 'true'
    || isMockMode()

  if (!hasRenderProvider) {
    return {
      renderId: `render_${Date.now()}`,
      status: 'provider_required',
      message: 'Video rendering requires configured render provider.',
      estimatedSeconds: undefined,
    }
  }

  return {
    renderId: `render_${Date.now()}`,
    status: 'queued',
    estimatedSeconds: 60,
  }
}

export async function createCampaign(
  input: z.infer<typeof campaignCreateInputSchema>,
  ctx: EngineContext,
): Promise<{
  campaignId: string
  name: string
  platform: string
  brief: z.infer<typeof briefResultSchema> | null
  scripts: z.infer<typeof scriptResultSchema>[]
  schedule: string | null
  status: 'draft'
}> {
  return {
    campaignId: `campaign_${Date.now()}`,
    name: input.name,
    platform: input.platform,
    brief: null,
    scripts: [],
    schedule: input.schedule ?? null,
    status: 'draft',
  }
}

export async function packageCampaign(
  input: z.infer<typeof campaignPackageInputSchema>,
  ctx: EngineContext,
): Promise<{
  packageId: string
  campaignId: string
  files: { name: string; type: string; url: string | null }[]
  summary: string
  status: 'packaged' | 'pending'
}> {
  return {
    packageId: `pkg_${Date.now()}`,
    campaignId: input.campaignId,
    files: [],
    summary: `Campaign ${input.campaignId} packaged for delivery.`,
    status: 'packaged',
  }
}
