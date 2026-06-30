import { handleRoute } from '@/lib/talocode-route-handler'

export async function POST(request: Request): Promise<Response> {
  return handleRoute(
    request,
    { action: 'brief.generate', credits: 15 },
    async () => {
      const body = await request.json().catch(() => ({}))
      // TODO: implement full brief generation flow
      return Response.json({
        ok: true,
        data: {
          id: `brief_${Date.now()}`,
          brief: body.prompt ?? '',
          channel: body.channel ?? 'twitter',
          estimatedDuration: 15,
        },
      })
    },
  )
}
