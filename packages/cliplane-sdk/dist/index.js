"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipLane = exports.ClipLaneLocal = void 0;
const DEFAULT_BASE_URL = "https://api.talocode.site";
const HOSTED_RENDER_KEY_ERROR = "TALOCODE_API_KEY required for hosted ClipLane requests.";
function envApiKey() {
    if (typeof process !== "undefined" && process?.env) {
        return process.env.TALOCODE_API_KEY;
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
    const product = clipWord(input.product ?? "ClipLane", "ClipLane");
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
        : `Use ClipLane to draft the next launch video.`;
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
    const product = clipWord(input.product ?? "ClipLane", "ClipLane");
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
                caption: "Install ClipLane from npm.",
                command: "npx @talocode/cliplane-cli",
            },
            {
                type: "terminal",
                caption: `Create a local video workflow for ${audience}.`,
                command: "cliplane init",
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
    const product = clipWord(input.product ?? "ClipLane", "ClipLane");
    return {
        post: `${script.hook} ${script.cta} #ClipLane #OpenSource`,
        hook: script.hook,
        cta: `Part of Talocode. ${product} helps builders ship launch content faster.`,
        hashtags: ["ClipLane", "OpenSource", "VideoWorkflow"],
    };
}
function makeId(prefix) {
    const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    return `${prefix}_${suffix}`;
}
function scheduleBody(input) {
    const scheduledFor = input.scheduledFor instanceof Date ? input.scheduledFor.toISOString() : input.scheduledFor;
    return JSON.stringify({ scheduledFor });
}
function normalizeRunAt(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime()))
        throw new Error("Schedule time must be a valid ISO-8601 timestamp.");
    if (date.getTime() <= Date.now())
        throw new Error("Schedule time must be in the future.");
    return date.toISOString();
}
async function localScheduleStore(path) {
    const fs = await Promise.resolve().then(() => __importStar(require("node:fs/promises")));
    try {
        const store = JSON.parse(await fs.readFile(path, "utf8"));
        if (!Array.isArray(store.jobs))
            throw new Error("Invalid local schedule store.");
        return { jobs: store.jobs };
    }
    catch (error) {
        if (error.code === "ENOENT")
            return { jobs: [] };
        throw error;
    }
}
async function writeLocalScheduleStore(path, store) {
    const [{ mkdir, writeFile }, { dirname }] = await Promise.all([Promise.resolve().then(() => __importStar(require("node:fs/promises"))), Promise.resolve().then(() => __importStar(require("node:path")))]);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify({ version: 1, ...store }, null, 2)}\n`, "utf8");
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
            : `ClipLane request failed with status ${response.status}`;
        throw new Error(message);
    }
    return data;
}
class ClipLaneLocal {
    scheduleStorePath;
    constructor(options = {}) {
        this.scheduleStorePath = options.scheduleStorePath ?? ".cliplane/schedules.json";
    }
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
            error: "Local render jobs are not persisted by ClipLaneLocal.",
        };
    }
    async exportForX(input) {
        return buildExportX(input);
    }
    async createSchedule(input) {
        const store = await localScheduleStore(this.scheduleStorePath);
        const id = makeId("schedule");
        const job = {
            id,
            contentId: input.contentId ?? null,
            title: input.title ?? null,
            runAt: normalizeRunAt(input.runAt),
            status: "scheduled",
            createdAt: new Date().toISOString(),
            cancelledAt: null,
        };
        store.jobs.push(job);
        await writeLocalScheduleStore(this.scheduleStorePath, store);
        return job;
    }
    async listSchedules() {
        const store = await localScheduleStore(this.scheduleStorePath);
        return store.jobs.sort((a, b) => a.runAt.localeCompare(b.runAt));
    }
    async cancelSchedule(id) {
        const store = await localScheduleStore(this.scheduleStorePath);
        const job = store.jobs.find((item) => item.id === id);
        if (!job)
            throw new Error(`Local schedule not found: ${id}`);
        if (job.status !== "cancelled") {
            job.status = "cancelled";
            job.cancelledAt = new Date().toISOString();
            await writeLocalScheduleStore(this.scheduleStorePath, store);
        }
        return job;
    }
}
exports.ClipLaneLocal = ClipLaneLocal;
/** Hosted ClipLane client. */
class ClipLane extends ClipLaneLocal {
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
        return hostedRequest(this.baseUrl, this.apiKey, "/v1/cliplane/renders", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    async getRenderJob(id) {
        if (!this.apiKey) {
            throw new Error(HOSTED_RENDER_KEY_ERROR);
        }
        return hostedRequest(this.baseUrl, this.apiKey, `/v1/cliplane/renders/${encodeURIComponent(id)}`);
    }
    async createScript(input) {
        if (!this.apiKey) {
            return super.createScript(input);
        }
        return hostedRequest(this.baseUrl, this.apiKey, "/v1/cliplane/scripts", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    async createStoryboard(input) {
        if (!this.apiKey) {
            return super.createStoryboard(input);
        }
        return hostedRequest(this.baseUrl, this.apiKey, "/v1/cliplane/storyboards", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    async exportForX(input) {
        if (!this.apiKey) {
            return super.exportForX(input);
        }
        return hostedRequest(this.baseUrl, this.apiKey, "/v1/cliplane/exports/x", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
    async scheduleContentItem(contentItemId, input) {
        return hostedRequest(this.baseUrl, this.apiKey, `/v1/cliplane/content-items/${encodeURIComponent(contentItemId)}/schedule`, {
            method: "POST",
            body: scheduleBody(input),
        });
    }
    async rescheduleContentItem(contentItemId, input) {
        return hostedRequest(this.baseUrl, this.apiKey, `/v1/cliplane/content-items/${encodeURIComponent(contentItemId)}/schedule`, {
            method: "PATCH",
            body: scheduleBody(input),
        });
    }
    async cancelScheduledContentItem(contentItemId) {
        return hostedRequest(this.baseUrl, this.apiKey, `/v1/cliplane/content-items/${encodeURIComponent(contentItemId)}/schedule`, {
            method: "DELETE",
        });
    }
    async getScheduleStatus(contentItemId) {
        return hostedRequest(this.baseUrl, this.apiKey, `/v1/cliplane/content-items/${encodeURIComponent(contentItemId)}/schedule`);
    }
}
exports.ClipLane = ClipLane;
//# sourceMappingURL=index.js.map