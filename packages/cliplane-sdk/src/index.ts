export type ClipLaneClientOptions = {
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

export type ScheduleInput = { scheduledFor: Date | string };

export type LocalScheduleInput = {
  runAt: Date | string;
  contentId?: string;
  title?: string;
};

export type LocalScheduleJob = {
  id: string;
  contentId: string | null;
  title: string | null;
  runAt: string;
  status: "scheduled" | "cancelled";
  createdAt: string;
  cancelledAt: string | null;
};

export type ClipLaneLocalOptions = { scheduleStorePath?: string };

export type ScheduleStatus = {
  item: { id: string; publishStatus: string; scheduledFor: string | null };
  job: { id: string; status: string; runAt: string; attempts: number; maxAttempts: number; lastError: string | null } | null;
};

export type ScheduleResult = {
  item: ScheduleStatus["item"];
  job: NonNullable<ScheduleStatus["job"]>;
  mode: "created" | "updated";
};

export type CancelScheduleResult = {
  item: ScheduleStatus["item"];
  cancelledJobId: string;
};

const DEFAULT_BASE_URL = "https://api.talocode.site";
const HOSTED_RENDER_KEY_ERROR =
  "TALOCODE_API_KEY required for hosted ClipLane requests.";

function envApiKey(): string | undefined {
  if (typeof process !== "undefined" && process?.env) {
    return process.env.TALOCODE_API_KEY;
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
  const product = clipWord(input.product ?? "ClipLane", "ClipLane");
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

function buildStoryboard(input: ProductUpdateInput): StoryboardResult {
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

function buildExportX(input: ProductUpdateInput): ExportXResult {
  const script = buildScript(input);
  const product = clipWord(input.product ?? "ClipLane", "ClipLane");

  return {
    post: `${script.hook} ${script.cta} #ClipLane #OpenSource`,
    hook: script.hook,
    cta: `Part of Talocode. ${product} helps builders ship launch content faster.`,
    hashtags: ["ClipLane", "OpenSource", "VideoWorkflow"],
  };
}

function makeId(prefix: string) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${suffix}`;
}

function scheduleBody(input: ScheduleInput) {
  const scheduledFor = input.scheduledFor instanceof Date ? input.scheduledFor.toISOString() : input.scheduledFor;
  return JSON.stringify({ scheduledFor });
}

function normalizeRunAt(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Schedule time must be a valid ISO-8601 timestamp.");
  if (date.getTime() <= Date.now()) throw new Error("Schedule time must be in the future.");
  return date.toISOString();
}

async function localScheduleStore(path: string): Promise<{ jobs: LocalScheduleJob[] }> {
  const fs = await import("node:fs/promises");
  try {
    const store = JSON.parse(await fs.readFile(path, "utf8")) as { jobs?: LocalScheduleJob[] };
    if (!Array.isArray(store.jobs)) throw new Error("Invalid local schedule store.");
    return { jobs: store.jobs };
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { jobs: [] };
    throw error;
  }
}

async function writeLocalScheduleStore(path: string, store: { jobs: LocalScheduleJob[] }) {
  const [{ mkdir, writeFile }, { dirname }] = await Promise.all([import("node:fs/promises"), import("node:path")]);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify({ version: 1, ...store }, null, 2)}\n`, "utf8");
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
        : `ClipLane request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export class ClipLaneLocal {
  readonly scheduleStorePath: string;

  constructor(options: ClipLaneLocalOptions = {}) {
    this.scheduleStorePath = options.scheduleStorePath ?? ".cliplane/schedules.json";
  }
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
      error: "Local render jobs are not persisted by ClipLaneLocal.",
    };
  }

  async exportForX(input: ProductUpdateInput): Promise<ExportXResult> {
    return buildExportX(input);
  }

  async createSchedule(input: LocalScheduleInput): Promise<LocalScheduleJob> {
    const store = await localScheduleStore(this.scheduleStorePath);
    const id = makeId("schedule");
    const job: LocalScheduleJob = {
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

  async listSchedules(): Promise<LocalScheduleJob[]> {
    const store = await localScheduleStore(this.scheduleStorePath);
    return store.jobs.sort((a, b) => a.runAt.localeCompare(b.runAt));
  }

  async cancelSchedule(id: string): Promise<LocalScheduleJob> {
    const store = await localScheduleStore(this.scheduleStorePath);
    const job = store.jobs.find((item) => item.id === id);
    if (!job) throw new Error(`Local schedule not found: ${id}`);
    if (job.status !== "cancelled") {
      job.status = "cancelled";
      job.cancelledAt = new Date().toISOString();
      await writeLocalScheduleStore(this.scheduleStorePath, store);
    }
    return job;
  }
}

/** Hosted ClipLane client. */
export class ClipLane extends ClipLaneLocal {
  readonly apiKey?: string;
  readonly baseUrl: string;

  constructor(options: ClipLaneClientOptions = {}) {
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

    return hostedRequest<RenderJob>(this.baseUrl, this.apiKey, "/v1/cliplane/renders", {
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
      `/v1/cliplane/renders/${encodeURIComponent(id)}`
    );
  }

  override async createScript(input: ProductUpdateInput): Promise<ScriptResult> {
    if (!this.apiKey) {
      return super.createScript(input);
    }

    return hostedRequest<ScriptResult>(this.baseUrl, this.apiKey, "/v1/cliplane/scripts", {
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
      "/v1/cliplane/storyboards",
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

    return hostedRequest<ExportXResult>(this.baseUrl, this.apiKey, "/v1/cliplane/exports/x", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async scheduleContentItem(contentItemId: string, input: ScheduleInput): Promise<ScheduleResult> {
    return hostedRequest<ScheduleResult>(this.baseUrl, this.apiKey, `/v1/cliplane/content-items/${encodeURIComponent(contentItemId)}/schedule`, {
      method: "POST",
      body: scheduleBody(input),
    });
  }

  async rescheduleContentItem(contentItemId: string, input: ScheduleInput): Promise<ScheduleResult> {
    return hostedRequest<ScheduleResult>(this.baseUrl, this.apiKey, `/v1/cliplane/content-items/${encodeURIComponent(contentItemId)}/schedule`, {
      method: "PATCH",
      body: scheduleBody(input),
    });
  }

  async cancelScheduledContentItem(contentItemId: string): Promise<CancelScheduleResult> {
    return hostedRequest<CancelScheduleResult>(this.baseUrl, this.apiKey, `/v1/cliplane/content-items/${encodeURIComponent(contentItemId)}/schedule`, {
      method: "DELETE",
    });
  }

  async getScheduleStatus(contentItemId: string): Promise<ScheduleStatus> {
    return hostedRequest<ScheduleStatus>(this.baseUrl, this.apiKey, `/v1/cliplane/content-items/${encodeURIComponent(contentItemId)}/schedule`);
  }
}
