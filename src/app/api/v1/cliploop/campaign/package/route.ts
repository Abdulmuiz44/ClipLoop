import { handleRoute } from '@/lib/talocode-route-handler'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: 'campaign.package', credits: 400 },
    async () => {
      const body = await request.json().catch(() => ({}))
      const { campaignId } = body as { campaignId?: string }

      if (!campaignId || typeof campaignId !== 'string') {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: 'campaignId is required and must be a string.' } },
          { status: 400 },
        )
      }

      // TODO: implement actual campaign packaging
      return Response.json({
        ok: true,
        data: {
          packageId: `pkg_${Date.now()}`,
          campaignId,
          status: 'packaged',
          downloadUrl: null,
        },
        usage: { action: 'campaign.package', credits: 400 },
      })
    },
  )
}
