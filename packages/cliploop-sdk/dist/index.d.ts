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
export declare class ClipLoopLocal {
    createScript(input: ProductUpdateInput): Promise<ScriptResult>;
    createStoryboard(input: ProductUpdateInput): Promise<StoryboardResult>;
    createRenderJob(input: ProductUpdateInput): Promise<RenderJob>;
    getRenderJob(id: string): Promise<RenderJob>;
    exportForX(input: ProductUpdateInput): Promise<ExportXResult>;
}
export declare class ClipLoop extends ClipLoopLocal {
    readonly apiKey?: string;
    readonly baseUrl: string;
    constructor(options?: ClipLoopClientOptions);
    createRenderJob(input: ProductUpdateInput): Promise<RenderJob>;
    getRenderJob(id: string): Promise<RenderJob>;
    createScript(input: ProductUpdateInput): Promise<ScriptResult>;
    createStoryboard(input: ProductUpdateInput): Promise<StoryboardResult>;
    exportForX(input: ProductUpdateInput): Promise<ExportXResult>;
}
