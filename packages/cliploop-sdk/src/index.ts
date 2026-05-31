export type WeeklyPromoInput = {
  appName: string;
  appWebsiteUrl: string;
  weeklyUpdate: string;
  targetAudience?: string;
  callToAction?: string;
  channel?: string;
  tone?: string;
};

export type WeeklyPromoResponse = {
  artifactId: string;
  previewUrl: string;
  downloadUrl: string;
  artifactUrl: string;
  script: string;
  scenePlan: string;
  creditsCharged: number;
  idempotencyKey: string;
};

export type ClipLoopClientOptions = {
  apiKey?: string;
  baseUrl?: string;
};

export type ClipLoopRequestOptions = {
  idempotencyKey?: string;
};

export class ClipLoopApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  readonly requestId?: string;

  constructor(args: {
    message: string;
    status: number;
    body?: unknown;
  }) {
    super(args.message);
    this.name = "ClipLoopApiError";
    this.status = args.status;
    this.body = args.body ?? null;
    const requestId =
      typeof this.body === "object" && this.body && "requestId" in this.body
        ? (this.body as { requestId?: string }).requestId
        : undefined;
    this.requestId = requestId;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      requestId: this.requestId,
    };
  }
}

const DEFAULT_BASE_URL = "https://app.cliploop.site";

function envApiKey(): string | undefined {
  if (typeof process !== "undefined" && process?.env) {
    return process.env.CLIPLOOP_API_KEY;
  }
  return undefined;
}

export class ClipLoopClient {
  readonly apiKey: string;
  readonly baseURL: string;

  constructor(options: ClipLoopClientOptions = {}) {
    if (!options.apiKey) {
      const envKey = envApiKey();
      if (!envKey) {
        throw new Error(
          "Missing API key. Pass apiKey or set CLIPLOOP_API_KEY."
        );
      }
      this.apiKey = envKey;
    } else {
      this.apiKey = options.apiKey;
    }

    const baseUrl =
      (typeof options.baseUrl === "string" && options.baseUrl.trim()) ||
      DEFAULT_BASE_URL;

    this.baseURL = baseUrl.replace(/\/$/, "");
  }

  async generateWeeklyPromo(
    input: WeeklyPromoInput,
    options: ClipLoopRequestOptions = {}
  ): Promise<WeeklyPromoResponse> {
    const idempotencyKey =
      options.idempotencyKey ?? `cliploop-sdk-${crypto.randomUUID()}`;

    const body = {
      ...input,
      targetAudience: input.targetAudience ?? null,
      callToAction: input.callToAction ?? null,
      channel: input.channel ?? null,
      tone: input.tone ?? null,
    };

    const response = await fetch(
      `${this.baseURL}/api/public/weekly-promo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      }
    );

    const text = await response.text();
    const data = text.length ? safeJsonParse(text) : {};

    if (!response.ok) {
      throw new ClipLoopApiError({
        message: buildMessage(response.status, data, idempotencyKey),
        status: response.status,
        body: data,
      });
    }

    return {
      ...data,
      idempotencyKey,
    } as WeeklyPromoResponse;
  }
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function buildMessage(
  status: number,
  body: unknown,
  idempotencyKey: string
) {
  const summary =
    typeof body === "object" && body && "error" in body
      ? String((body as Record<string, unknown>).error)
      : typeof body === "string"
        ? body
        : "Request failed.";

  return `ClipLoop API error ${status}: ${summary} (idempotencyKey: ${idempotencyKey})`;
}
