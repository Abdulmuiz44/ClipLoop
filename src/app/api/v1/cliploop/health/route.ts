import { extractApiKeyFromRequest, validateApiKey } from '@/lib/talocode-auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const apiKey = extractApiKeyFromRequest(request)
  const auth = validateApiKey(apiKey)

  if (!auth.valid) {
    return Response.json(
      { ok: false, error: { code: auth.reason === 'MISSING_API_KEY' ? 'missing_api_key' : 'invalid_api_key', message: 'Unauthorized.' } },
      { status: 401 },
    )
  }

  if (auth.keyType === 'cliploop_legacy') {
    console.warn('[talocode-auth] CLIPLOOP_API_KEY is deprecated. Use TALOCODE_API_KEY for hosted ClipLoop API access.')
  }

  return Response.json({
    ok: true,
    service: 'cliploop',
    status: 'healthy',
    version: '0.1.0',
  })
}
