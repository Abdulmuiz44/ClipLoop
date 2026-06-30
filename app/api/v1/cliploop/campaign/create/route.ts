import { handleRoute } from '@/lib/talocode-route-handler'

export async function POST(request: Request): Promise<Response> {
  return handleRoute(
    request,
    { action: 'campaign.create', credits: 50 },
    async () => {
      const body = await request.json().catch(() => ({}))
      // TODO: implement campaign creation
      return Response.json({
        ok: true,
        data: {
          id: `camp_${Date.now()}`,
          name: body.name ?? 'Untitled Campaign',
          status: 'draft',
          videos: [],
        },
      })
    },
  )
}
