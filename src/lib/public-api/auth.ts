import { ApiKeyAuthError, authenticateApiKey } from "@/domains/api-keys/service";

export class PublicApiAuthRequiredError extends Error {
  constructor() {
    super("API key required.");
  }
}

export function extractBearerToken(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

export async function requireApiKeyIdentity(request: Request) {
  const token = extractBearerToken(request);
  if (!token) throw new PublicApiAuthRequiredError();

  try {
    return await authenticateApiKey(token);
  } catch (err) {
    if (err instanceof ApiKeyAuthError) throw err;
    throw err;
  }
}
