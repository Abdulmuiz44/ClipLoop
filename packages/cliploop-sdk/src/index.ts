export type WeeklyPromoChannel = "instagram" | "tiktok" | "whatsapp" | "x";

export type WeeklyPromoInput = {
  appName: string;
  appWebsiteUrl?: string;
  weeklyUpdate: string;
  targetAudience?: string;
  callToAction?: string;
  channel: WeeklyPromoChannel;
  tone: string;
};

export type WeeklyPromoResponse = {
  artifactId: string;
  previewUrl: string | null;
  downloadUrl: string | null;
  artifactUrl: string | null;
  script: Record<string, unknown>;
  scenePlan: unknown[];
  creditsCharged: number;
  renderStatus: string;
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
const TALOCODE_CLOUD_URL = "https://api.talocode.site";

function envApiKey(): string | undefined {
  if (typeof process !== "undefined" && process?.env) {
    if (process.env.TALOCODE_API_KEY) {
      return process.env.TALOCODE_API_KEY;
    }
    if (process.env.CLIPLOOP_API_KEY) {
      if (typeof process.emitWarning === "function") {
        process.emitWarning(
          "CLIPLOOP_API_KEY is deprecated. Use TALOCODE_API_KEY for hosted ClipLoop API access.",
          "DeprecationWarning"
        );
      }
      return process.env.CLIPLOOP_API_KEY;
    }
  }
  return undefined;
}

export class ClipLoopClient {
  readonly apiKey: string;
  readonly baseURL: string;
  readonly talocodeBaseURL: string;

  constructor(options: ClipLoopClientOptions = {}) {
    if (!options.apiKey) {
      const envKey = envApiKey();
      if (!envKey) {
        throw new Error(
          "Missing API key. Pass apiKey or set TALOCODE_API_KEY (or legacy CLIPLOOP_API_KEY)."
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
    this.talocodeBaseURL =
      (typeof process !== "undefined" &&
        process.env?.TALOCODE_BASE_URL) ||
      TALOCODE_CLOUD_URL;
  }

  async generateWeeklyPromo(
    input: WeeklyPromoInput,
    options: ClipLoopRequestOptions = {}
  ): Promise<WeeklyPromoResponse> {
    const idempotencyKey =
      options.idempotencyKey ?? `cliploop-sdk-${crypto.randomUUID()}`;

    const body: Record<string, unknown> = {
      appName: input.appName,
      weeklyUpdate: input.weeklyUpdate,
      channel: input.channel,
      tone: input.tone,
    };

    if (input.appWebsiteUrl !== undefined) {
      body.appWebsiteUrl = input.appWebsiteUrl;
    }

    if (input.targetAudience !== undefined) {
      body.targetAudience = input.targetAudience;
    }

    if (input.callToAction !== undefined) {
      body.callToAction = input.callToAction;
    }

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

  // ─── Talocode Cloud hosted API methods ──────────────────────────────

  async generateBrief(
    input: { prompt: string; channel?: string; tone?: string; duration?: number; cta?: string },
    options: ClipLoopRequestOptions = {}
  ): Promise<Record<string, unknown>> {
    const idempotencyKey = options.idempotencyKey ?? `clp-sdk-${crypto.randomUUID()}`
    const response = await fetch(
      `${this.talocodeBaseURL}/v1/cliploop/brief/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(input),
      }
    )
    const data = await response.json()
    if (!response.ok) {
      throw new ClipLoopApiError({
        message: `ClipLoop Cloud API error ${response.status}: ${data?.error?.message ?? "Request failed."}`,
        status: response.status,
        body: data,
      })
    }
    return { ...data, idempotencyKey }
  }

  async generateScript(
    input: { briefId: string; style?: string },
    options: ClipLoopRequestOptions = {}
  ): Promise<Record<string, unknown>> {
    const idempotencyKey = options.idempotencyKey ?? `clp-sdk-${crypto.randomUUID()}`
    const response = await fetch(
      `${this.talocodeBaseURL}/v1/cliploop/script/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(input),
      }
    )
    const data = await response.json()
    if (!response.ok) {
      throw new ClipLoopApiError({
        message: `ClipLoop Cloud API error ${response.status}: ${data?.error?.message ?? "Request failed."}`,
        status: response.status,
        body: data,
      })
    }
    return { ...data, idempotencyKey }
  }

  async renderVideo(
    input: { scriptId: string; format?: string; quality?: string },
    options: ClipLoopRequestOptions = {}
  ): Promise<Record<string, unknown>> {
    const idempotencyKey = options.idempotencyKey ?? `clp-sdk-${crypto.randomUUID()}`
    const response = await fetch(
      `${this.talocodeBaseURL}/v1/cliploop/video/render`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(input),
      }
    )
    const data = await response.json()
    if (!response.ok) {
      throw new ClipLoopApiError({
        message: `ClipLoop Cloud API error ${response.status}: ${data?.error?.message ?? "Request failed."}`,
        status: response.status,
        body: data,
      })
    }
    return { ...data, idempotencyKey }
  }

  async createCampaign(
    input: { name: string; platform: string; schedule?: string },
    options: ClipLoopRequestOptions = {}
  ): Promise<Record<string, unknown>> {
    const idempotencyKey = options.idempotencyKey ?? `clp-sdk-${crypto.randomUUID()}`
    const response = await fetch(
      `${this.talocodeBaseURL}/v1/cliploop/campaign/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(input),
      }
    )
    const data = await response.json()
    if (!response.ok) {
      throw new ClipLoopApiError({
        message: `ClipLoop Cloud API error ${response.status}: ${data?.error?.message ?? "Request failed."}`,
        status: response.status,
        body: data,
      })
    }
    return { ...data, idempotencyKey }
  }

  async packageCampaign(
    input: { campaignId: string },
    options: ClipLoopRequestOptions = {}
  ): Promise<Record<string, unknown>> {
    const idempotencyKey = options.idempotencyKey ?? `clp-sdk-${crypto.randomUUID()}`
    const response = await fetch(
      `${this.talocodeBaseURL}/v1/cliploop/campaign/package`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(input),
      }
    )
    const data = await response.json()
    if (!response.ok) {
      throw new ClipLoopApiError({
        message: `ClipLoop Cloud API error ${response.status}: ${data?.error?.message ?? "Request failed."}`,
        status: response.status,
        body: data,
      })
    }
    return { ...data, idempotencyKey }
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
