import { handleRoute } from '@/lib/talocode-route-handler'
import { renderVideo, renderInputSchema } from '@/lib/cliploop-cloud-engine'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: 'video.render', credits: 200 },
    async () => {
      const body = await request.json().catch(() => ({}))
      const parsed = renderInputSchema.safeParse(body)
      if (!parsed.success) {
        return Response.json(
          { ok: false, error: { code: 'validation_error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' } },
          { status: 400 },
        )
      }

      const result = await renderVideo(parsed.data, {
        requestId: `cliploop_req_${Date.now()}`,
        keyType: 'talocode',
        action: 'video.render',
        credits: 200,
        mode: 'hosted',
        idempotencyKey: `idem_${Date.now()}`,
      })

      if (result.status === 'provider_required') {
        return Response.json({
          id: `cliploop_req_${Date.now()}`,
          object: 'cliploop.video_render',
          result,
          usage: { credits: 200, action: 'cliploop.video.render' },
          warnings: [{ code: 'provider_required', message: result.message }],
        })
      }

      return Response.json({
        id: `cliploop_req_${Date.now()}`,
        object: 'cliploop.video_render',
        result,
        usage: { credits: 200, action: 'cliploop.video.render' },
      })
    },
  )
}
