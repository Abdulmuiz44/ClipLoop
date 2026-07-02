/**
 * Talocode Cloud API authentication for ClipLoop hosted API.
 *
 * Accepts TALOCODE_API_KEY (primary) and CLIPLOOP_API_KEY (deprecated fallback).
 */

export interface TalocodeAuthResult {
  valid: boolean
  keyType: 'talocode' | 'cliploop_legacy' | null
  reason?: string
}

/**
 * Resolve the effective API key from env, preferring TALOCODE_API_KEY.
 * Logs a deprecation warning when falling back to CLIPLOOP_API_KEY.
 */
export function getEffectiveApiKey(): string | undefined {
  if (process.env.TALOCODE_API_KEY) {
    return process.env.TALOCODE_API_KEY
  }
  if (process.env.CLIPLOOP_API_KEY) {
    console.warn('[talocode-auth] CLIPLOOP_API_KEY is deprecated. Use TALOCODE_API_KEY for hosted ClipLoop API access.')
    return process.env.CLIPLOOP_API_KEY
  }
  return undefined
}

/**
 * Validate an incoming API key against configured keys.
 *
 * - If TALOCODE_API_KEY is set, only accept that.
 * - If only CLIPLOOP_API_KEY is set (legacy), accept that.
 * - If neither is set, return not_configured error.
 */
export function validateApiKey(incomingKey: string | null | undefined): TalocodeAuthResult {
  if (!incomingKey) {
    return { valid: false, keyType: null, reason: 'MISSING_API_KEY' }
  }

  const talocodeKey = process.env.TALOCODE_API_KEY
  const cliploopKey = process.env.CLIPLOOP_API_KEY

  if (talocodeKey && incomingKey === talocodeKey) {
    return { valid: true, keyType: 'talocode' }
  }

  if (cliploopKey && incomingKey === cliploopKey) {
    return { valid: true, keyType: 'cliploop_legacy' }
  }

  return { valid: false, keyType: null, reason: 'INVALID_API_KEY' }
}

/**
 * Extract the API key from request headers, supporting:
 * - Authorization: Bearer <key>
 * - X-Api-Key: <key>
 */
export function extractApiKeyFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const xApiKey = request.headers.get('x-api-key')
  if (xApiKey) {
    return xApiKey
  }
  return null
}
