import { handleRoute } from '@/lib/talocode-route-handler'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: 'script.generate', credits: 15 },
    async () => {
      const body = await request.json().catch(() => ({}))
      const { briefId, style } = body as {
        briefId?: string
        style?: string
      }

      if (!briefId || typeof briefId !== 'string') {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: 'briefId is required and must be a string.' } },
          { status: 400 },
        )
      }

      // TODO: implement actual script generation
      return Response.json({
        ok: true,
        data: {
          scriptId: `script_${Date.now()}`,
          briefId,
          style: style ?? 'standard',
          scenes: [],
          status: 'draft',
        },
        usage: { action: 'script.generate', credits: 15 },
      })
    },
  )
}
