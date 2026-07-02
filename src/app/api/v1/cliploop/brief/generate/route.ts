import { handleRoute } from '@/lib/talocode-route-handler'
import { generateBrief, briefInputSchema } from '@/lib/cliploop-cloud-engine'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: 'brief.generate', credits: 15 },
    async () => {
      const body = await request.json().catch(() => ({}))
      const parsed = briefInputSchema.safeParse(body)
      if (!parsed.success) {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' } },
          { status: 400 },
        )
      }

      const result = await generateBrief(parsed.data, {
        requestId: `cliploop_req_${Date.now()}`,
        keyType: 'talocode',
        action: 'brief.generate',
        credits: 15,
        mode: 'hosted',
        idempotencyKey: `idem_${Date.now()}`,
      })

      return Response.json({
        id: `cliploop_req_${Date.now()}`,
        object: 'cliploop.brief',
        result,
        usage: { credits: 15, action: 'cliploop.brief.generate' },
      })
    },
  )
}
