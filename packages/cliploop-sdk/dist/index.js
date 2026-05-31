export class ClipLoopApiError extends Error {
    status;
    body;
    requestId;
    constructor(args) {
        super(args.message);
        this.name = "ClipLoopApiError";
        this.status = args.status;
        this.body = args.body ?? null;
        const requestId = typeof this.body === "object" && this.body && "requestId" in this.body
            ? this.body.requestId
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
function envApiKey() {
    if (typeof process !== "undefined" && process?.env) {
        return process.env.CLIPLOOP_API_KEY;
    }
    return undefined;
}
export class ClipLoopClient {
    apiKey;
    baseURL;
    constructor(options = {}) {
        if (!options.apiKey) {
            const envKey = envApiKey();
            if (!envKey) {
                throw new Error("Missing API key. Pass apiKey or set CLIPLOOP_API_KEY.");
            }
            this.apiKey = envKey;
        }
        else {
            this.apiKey = options.apiKey;
        }
        const baseUrl = (typeof options.baseUrl === "string" && options.baseUrl.trim()) ||
            DEFAULT_BASE_URL;
        this.baseURL = baseUrl.replace(/\/$/, "");
    }
    async generateWeeklyPromo(input, options = {}) {
        const idempotencyKey = options.idempotencyKey ?? `cliploop-sdk-${crypto.randomUUID()}`;
        const body = {
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
        const response = await fetch(`${this.baseURL}/api/public/weekly-promo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
                "Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify(body),
        });
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
        };
    }
}
function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    }
    catch {
        return value;
    }
}
function buildMessage(status, body, idempotencyKey) {
    const summary = typeof body === "object" && body && "error" in body
        ? String(body.error)
        : typeof body === "string"
            ? body
            : "Request failed.";
    return `ClipLoop API error ${status}: ${summary} (idempotencyKey: ${idempotencyKey})`;
}
//# sourceMappingURL=index.js.map