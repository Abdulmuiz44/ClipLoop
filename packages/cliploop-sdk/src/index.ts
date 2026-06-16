export type ClipLoopClientOptions = {
  apiKey?: string;
  baseUrl?: string;
};

export type ProductUpdateInput = {
  update: string;
  product?: string;
  audience?: string;
  tone?: "builder" | "technical" | "launch" | "simple";
  format?: string;
};

export type ScriptResult = {
  hook: string;
  problem: string;
  whatShipped: string;
  whyItMatters: string;
  cta: string;
  fullScript: string;
};

export type StoryboardScene = {
  type: "title" | "terminal" | "feature-list" | "caption" | "cta";
  caption: string;
  command?: string;
  items?: string[];
};

export type StoryboardResult = {
  title: string;
  duration: number;
  scenes: StoryboardScene[];
};

export type RenderJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
};

export type ExportXResult = {
  post: string;
  hook: string;
  cta: string;
  hashtags: string[];
};

const DEFAULT_BASE_URL = "https://api.cliploop.site";
const HOSTED_RENDER_KEY_ERROR =
  "ClipLoop API key required for hosted rendering. Get one at https://cliploop.site";

function envApiKey(): string | undefined {
  if (typeof process !== "undefined" && process?.env) {
    return process.env.CLIPLOOP_API_KEY;
  }
  return undefined;
}

function normalizeBaseUrl(baseUrl?: string) {
  return (baseUrl?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function clipWord(value: string, fallback: string) {
  const cleaned = cleanText(value);
  return cleaned.length ? cleaned : fallback;
}

function toneLabel(tone: ProductUpdateInput["tone"]) {
  return tone ?? "builder";
}

function buildScript(input: ProductUpdateInput): ScriptResult {
  const product = clipWord(input.product ?? "ClipLoop", "ClipLoop");
  const audience = clipWord(input.audience ?? "builders", "builders");
  const update = clipWord(input.update, "We shipped something new.");
  const tone = toneLabel(input.tone);

  const hook =
    tone === "launch"
      ? `${product} just shipped a new workflow for ${audience}.`
      : `Turn ${update.toLowerCase()} into a promo video workflow.`;

  const problem = `Builders need a faster way to turn product updates into short-form promo videos.`;
  const whatShipped = `${product} shipped: ${update}`;
  const whyItMatters =
    tone === "technical"
      ? "It gives developers a local-first way to turn product updates into scripts, storyboards, and render jobs."
      : `It helps ${audience} move from product update to launch-ready video assets without closed tooling.`;
  const cta =
    tone === "simple"
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

function buildStoryboard(input: ProductUpdateInput): StoryboardResult {
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

function buildExportX(input: ProductUpdateInput): ExportXResult {
  const script = buildScript(input);
  const product = clipWord(input.product ?? "ClipLoop", "ClipLoop");

  return {
    post: `${script.hook} ${script.cta} #ClipLoop #OpenSource`,
    hook: script.hook,
    cta: `Part of Talocode. ${product} helps builders ship launch content faster.`,
    hashtags: ["ClipLoop", "OpenSource", "VideoWorkflow"],
  };
}

function makeId(prefix: string) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${suffix}`;
}

async function hostedRequest<T>(
  baseUrl: string,
  apiKey: string | undefined,
  path: string,
  init?: RequestInit
): Promise<T> {
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
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as Record<string, unknown>).error)
        : `ClipLoop request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export class ClipLoopLocal {
  async createScript(input: ProductUpdateInput): Promise<ScriptResult> {
    return buildScript(input);
  }

  async createStoryboard(input: ProductUpdateInput): Promise<StoryboardResult> {
    return buildStoryboard(input);
  }

  async createRenderJob(input: ProductUpdateInput): Promise<RenderJob> {
    return {
      id: makeId("local"),
      status: "queued",
      error: "Local render jobs require an installed renderer.",
    };
  }

  async getRenderJob(id: string): Promise<RenderJob> {
    return {
      id,
      status: "failed",
      error: "Local render jobs are not persisted by ClipLoopLocal.",
    };
  }

  async exportForX(input: ProductUpdateInput): Promise<ExportXResult> {
    return buildExportX(input);
  }
}

export class ClipLoop extends ClipLoopLocal {
  readonly apiKey?: string;
  readonly baseUrl: string;

  constructor(options: ClipLoopClientOptions = {}) {
    super();
    this.apiKey = options.apiKey ?? envApiKey();
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
  }

  override async createRenderJob(
    input: ProductUpdateInput
  ): Promise<RenderJob> {
    if (!this.apiKey) {
      throw new Error(HOSTED_RENDER_KEY_ERROR);
    }

    return hostedRequest<RenderJob>(this.baseUrl, this.apiKey, "/v1/renders", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  override async getRenderJob(id: string): Promise<RenderJob> {
    if (!this.apiKey) {
      throw new Error(HOSTED_RENDER_KEY_ERROR);
    }

    return hostedRequest<RenderJob>(
      this.baseUrl,
      this.apiKey,
      `/v1/renders/${encodeURIComponent(id)}`
    );
  }

  override async createScript(input: ProductUpdateInput): Promise<ScriptResult> {
    if (!this.apiKey) {
      return super.createScript(input);
    }

    return hostedRequest<ScriptResult>(this.baseUrl, this.apiKey, "/v1/scripts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  override async createStoryboard(
    input: ProductUpdateInput
  ): Promise<StoryboardResult> {
    if (!this.apiKey) {
      return super.createStoryboard(input);
    }

    return hostedRequest<StoryboardResult>(
      this.baseUrl,
      this.apiKey,
      "/v1/storyboards",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );
  }

  override async exportForX(input: ProductUpdateInput): Promise<ExportXResult> {
    if (!this.apiKey) {
      return super.exportForX(input);
    }

    return hostedRequest<ExportXResult>(this.baseUrl, this.apiKey, "/v1/exports/x", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}
