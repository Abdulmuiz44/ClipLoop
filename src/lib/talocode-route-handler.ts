import { validateApiKey, extractApiKeyFromRequest } from './talocode-auth'
import { chargeCredits } from './talocode-billing'

export interface RouteHandlerOptions {
  action: string
  credits: number
  getRequestId?: () => string
}

const defaultGetRequestId = () =>
  `clp_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

export async function handleRoute(
  request: Request,
  options: RouteHandlerOptions,
  execute: () => Promise<Response>,
): Promise<Response> {
  const apiKey = extractApiKeyFromRequest(request)
  const auth = validateApiKey(apiKey)
  const getRequestId = options.getRequestId ?? defaultGetRequestId

  if (!auth.valid) {
    if (auth.reason === 'MISSING_API_KEY') {
      return Response.json(
        { ok: false, error: { code: 'missing_api_key', message: 'Missing Talocode Cloud API key. Provide via Authorization: Bearer header or X-Api-Key header.' } },
        { status: 401 },
      )
    }
    return Response.json(
      { ok: false, error: { code: 'invalid_api_key', message: 'Invalid API key.' } },
      { status: 401 },
    )
  }

  if (auth.keyType === 'cliploop_legacy') {
    console.warn('[talocode-auth] CLIPLOOP_API_KEY is deprecated. Use TALOCODE_API_KEY.')
  }

  if (!apiKey) {
    return Response.json(
      { ok: false, error: { code: 'missing_api_key', message: 'Missing API key.' } },
      { status: 401 },
    )
  }

  const requestId = getRequestId()

  const chargeResult = await chargeCredits(apiKey, {
    product: 'cliploop',
    action: options.action,
    credits: options.credits,
    requestId,
    idempotencyKey: requestId,
    metadata: {
      route: `/v1/cliploop/${options.action.replace('.', '/')}`,
    },
  })

  if (!chargeResult.success) {
    const err = chargeResult.error!
    const status = err.code === 'insufficient_credits' ? 402 : err.code === 'auth_error' ? 401 : 502
    return Response.json(
      { ok: false, error: err },
      { status },
    )
  }

  return execute()
}
