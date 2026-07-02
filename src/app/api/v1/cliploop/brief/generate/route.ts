import { handleRoute } from '@/lib/talocode-route-handler'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: 'brief.generate', credits: 15 },
    async () => {
      const body = await request.json().catch(() => ({}))
      const { prompt, channel, tone, duration, cta } = body as {
        prompt?: string
        channel?: string
        tone?: string
        duration?: number
        cta?: string
      }

      if (!prompt || typeof prompt !== 'string') {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: 'prompt is required and must be a string.' } },
          { status: 400 },
        )
      }

      // TODO: implement actual brief generation
      // This is a placeholder until ClipLoop brief generation is integrated
      return Response.json({
        ok: true,
        data: {
          briefId: `brief_${Date.now()}`,
          prompt,
          channel: channel ?? 'generic',
          tone: tone ?? 'professional',
          duration: duration ?? 30,
          cta: cta ?? null,
          status: 'draft',
        },
        usage: { action: 'brief.generate', credits: 15 },
      })
    },
  )
}
