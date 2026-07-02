import { handleRoute } from '@/lib/talocode-route-handler'
import { createCampaign, campaignCreateInputSchema } from '@/lib/cliploop-cloud-engine'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: 'campaign.create', credits: 50 },
    async () => {
      const body = await request.json().catch(() => ({}))
      const parsed = campaignCreateInputSchema.safeParse(body)
      if (!parsed.success) {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' } },
          { status: 400 },
        )
      }

      const result = await createCampaign(parsed.data, {
        requestId: `cliploop_req_${Date.now()}`,
        keyType: 'talocode',
        action: 'campaign.create',
        credits: 50,
        mode: 'hosted',
        idempotencyKey: `idem_${Date.now()}`,
      })

      return Response.json({
        id: `cliploop_req_${Date.now()}`,
        object: 'cliploop.campaign',
        result,
        usage: { credits: 50, action: 'cliploop.campaign.create' },
      })
    },
  )
}
