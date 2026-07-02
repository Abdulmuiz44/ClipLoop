import { handleRoute } from '@/lib/talocode-route-handler'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: 'campaign.create', credits: 50 },
    async () => {
      const body = await request.json().catch(() => ({}))
      const { name, platform, schedule } = body as {
        name?: string
        platform?: string
        schedule?: string
      }

      if (!name || typeof name !== 'string') {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: 'name is required and must be a string.' } },
          { status: 400 },
        )
      }

      if (!platform || typeof platform !== 'string') {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: 'platform is required and must be a string.' } },
          { status: 400 },
        )
      }

      // TODO: implement actual campaign creation
      return Response.json({
        ok: true,
        data: {
          campaignId: `camp_${Date.now()}`,
          name,
          platform,
          schedule: schedule ?? null,
          status: 'draft',
        },
        usage: { action: 'campaign.create', credits: 50 },
      })
    },
  )
}
