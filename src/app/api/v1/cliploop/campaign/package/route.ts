import { handleRoute } from '@/lib/talocode-route-handler'
import { packageCampaign, campaignPackageInputSchema } from '@/lib/cliploop-cloud-engine'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: 'campaign.package', credits: 400 },
    async () => {
      const body = await request.json().catch(() => ({}))
      const parsed = campaignPackageInputSchema.safeParse(body)
      if (!parsed.success) {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' } },
          { status: 400 },
        )
      }

      const result = await packageCampaign(parsed.data, {
        requestId: `cliploop_req_${Date.now()}`,
        keyType: 'talocode',
        action: 'campaign.package',
        credits: 400,
        mode: 'hosted',
        idempotencyKey: `idem_${Date.now()}`,
      })

      return Response.json({
        id: `cliploop_req_${Date.now()}`,
        object: 'cliploop.campaign_package',
        result,
        usage: { credits: 400, action: 'cliploop.campaign.package' },
      })
    },
  )
}
