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
export type ScheduleInput = {
    scheduledFor: Date | string;
};
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
export type ClipLaneLocalOptions = {
    scheduleStorePath?: string;
};
export type ScheduleStatus = {
    item: {
        id: string;
        publishStatus: string;
        scheduledFor: string | null;
    };
    job: {
        id: string;
        status: string;
        runAt: string;
        attempts: number;
        maxAttempts: number;
        lastError: string | null;
    } | null;
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
export declare class ClipLaneLocal {
    readonly scheduleStorePath: string;
    constructor(options?: ClipLaneLocalOptions);
    createScript(input: ProductUpdateInput): Promise<ScriptResult>;
    createStoryboard(input: ProductUpdateInput): Promise<StoryboardResult>;
    createRenderJob(input: ProductUpdateInput): Promise<RenderJob>;
    getRenderJob(id: string): Promise<RenderJob>;
    exportForX(input: ProductUpdateInput): Promise<ExportXResult>;
    createSchedule(input: LocalScheduleInput): Promise<LocalScheduleJob>;
    listSchedules(): Promise<LocalScheduleJob[]>;
    cancelSchedule(id: string): Promise<LocalScheduleJob>;
}
/** Legacy hosted ClipLoop client retained for the existing hosted API. */
export declare class ClipLoop extends ClipLaneLocal {
    readonly apiKey?: string;
    readonly baseUrl: string;
    constructor(options?: ClipLoopClientOptions);
    createRenderJob(input: ProductUpdateInput): Promise<RenderJob>;
    getRenderJob(id: string): Promise<RenderJob>;
    createScript(input: ProductUpdateInput): Promise<ScriptResult>;
    createStoryboard(input: ProductUpdateInput): Promise<StoryboardResult>;
    exportForX(input: ProductUpdateInput): Promise<ExportXResult>;
    scheduleContentItem(contentItemId: string, input: ScheduleInput): Promise<ScheduleResult>;
    rescheduleContentItem(contentItemId: string, input: ScheduleInput): Promise<ScheduleResult>;
    cancelScheduledContentItem(contentItemId: string): Promise<CancelScheduleResult>;
    getScheduleStatus(contentItemId: string): Promise<ScheduleStatus>;
}
