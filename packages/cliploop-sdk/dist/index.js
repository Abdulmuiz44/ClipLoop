"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipLoop = exports.ClipLoopLocal = void 0;
const DEFAULT_BASE_URL = "https://api.cliploop.site";
const HOSTED_RENDER_KEY_ERROR = "ClipLoop API key required for hosted rendering. Get one at https://cliploop.site";
function envApiKey() {
    if (typeof process !== "undefined" && process?.env) {
        return process.env.CLIPLOOP_API_KEY;
    }
    return undefined;
}
function normalizeBaseUrl(baseUrl) {
    return (baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
}
function cleanText(value) {
    return value.trim().replace(/\s+/g, " ");
}
function clipWord(value, fallback) {
    const cleaned = cleanText(value);
    return cleaned.length ? cleaned : fallback;
}
function toneLabel(tone) {
    return tone ?? "builder";
}
function buildScript(input) {
    const product = clipWord(input.product ?? "ClipLoop", "ClipLoop");
    const audience = clipWord(input.audience ?? "builders", "builders");
    const update = clipWord(input.update, "We shipped something new.");
    const tone = toneLabel(input.tone);
    const hook = tone === "launch"
        ? `${product} just shipped a new workflow for ${audience}.`
        : `Turn ${update.toLowerCase()} into a promo video workflow.`;
    const problem = `Builders need a faster way to turn product updates into short-form promo videos.`;
    const whatShipped = `${product} shipped: ${update}`;
    const whyItMatters = tone === "technical"
        ? "It gives developers a local-first way to turn product updates into scripts, storyboards, and render jobs."
        : `It helps ${audience} move from product update to launch-ready video assets without closed tooling.`;
    const cta = tone === "simple"
        ? "Try the local workflow."
        : `Use ClipLoop to draft the next launch video.`;
    const fullScript = [
        hook,
        problem,
        whatShipped,
        whyItMatters,
        cta,
    ].join(" ");
    return { hook, problem, whatShipped, whyItMatters, cta, fullScript };
}
function buildStoryboard(input) {
    const script = buildScript(input);
    const product = clipWord(input.product ?? "ClipLoop", "ClipLoop");
    const audience = clipWord(input.audience ?? "builders", "builders");
    return {
        title: `${product} video workflow`,
        duration: 42,
        scenes: [
            {
                type: "title",
                caption: `${product} v0.1.0\nOpen Video Workflow Layer`,
            },
            {
                type: "terminal",
                caption: "Install ClipLoop from npm.",
                command: "npx @talocode/cliploop",
            },
            {
                type: "terminal",
                caption: `Create a local video workflow for ${audience}.`,
                command: "cliploop init",
            },
            {
                type: "caption",
                caption: script.hook,
            },
            {
                type: "feature-list",
                caption: "Structured promo workflow",
                items: ["Scripts", "Storyboards", "Render jobs", "X export"],
            },
            {
                type: "cta",
                caption: "Open-source and local-first, with optional hosted rendering.",
            },
        ],
    };
}
function buildExportX(input) {
    const script = buildScript(input);
    const product = clipWord(input.product ?? "ClipLoop", "ClipLoop");
    return {
        post: `${script.hook} ${script.cta} #ClipLoop #OpenSource`,
        hook: script.hook,
        cta: `Part of Talocode. ${product} helps builders ship launch content faster.`,
        hashtags: ["ClipLoop", "OpenSource", "VideoWorkflow"],
    };
}
function makeId(prefix) {
    const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    return `${prefix}_${suffix}`;
}
async function hostedRequest(baseUrl, apiKey, path, init) {
    if (!apiKey) {
        throw new Error(HOSTED_RENDER_KEY_ERROR);
    }
    const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...(init?.headers ?? {}),
        },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
        const message = typeof data === "object" && data && "error" in data
            ? String(data.error)
            : `ClipLoop request failed with status ${response.status}`;
        throw new Error(message);
    }
    return data;
}
class ClipLoopLocal {
    async createScript(input) {
        return buildScript(input);
    }
    async createStoryboard(input) {
        return buildStoryboard(input);
    }
    async createRenderJob(input) {
        return {
            id: makeId("local"),
            status: "queued",
            error: "Local render jobs require an installed renderer.",
        };
    }
    async getRenderJob(id) {
        return {
            id,
            status: "failed",
            error: "Local render jobs are not persisted by ClipLoopLocal.",
        };
    }
    async exportForX(input) {
        return buildExportX(input);
    }
}
exports.ClipLoopLocal = ClipLoopLocal;
class ClipLoop extends ClipLoopLocal {
    apiKey;
    baseUrl;
    constructor(options = {}) {
        super();
        this.apiKey = options.apiKey ?? envApiKey();
        this.baseUrl = normalizeBaseUrl(options.baseUrl);
    }
    async createRenderJob(input) {
        if (!this.apiKey) {
            throw new Error(HOSTED_RENDER_KEY_ERROR);
        }
        return hostedRequest(this.baseUrl, this.apiKey, "/v1/renders", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    async getRenderJob(id) {
        if (!this.apiKey) {
            throw new Error(HOSTED_RENDER_KEY_ERROR);
        }
        return hostedRequest(this.baseUrl, this.apiKey, `/v1/renders/${encodeURIComponent(id)}`);
    }
    async createScript(input) {
        if (!this.apiKey) {
            return super.createScript(input);
        }
        return hostedRequest(this.baseUrl, this.apiKey, "/v1/scripts", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    async createStoryboard(input) {
        if (!this.apiKey) {
            return super.createStoryboard(input);
        }
        return hostedRequest(this.baseUrl, this.apiKey, "/v1/storyboards", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    async exportForX(input) {
        if (!this.apiKey) {
            return super.exportForX(input);
        }
        return hostedRequest(this.baseUrl, this.apiKey, "/v1/exports/x", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
}
exports.ClipLoop = ClipLoop;
//# sourceMappingURL=index.js.map