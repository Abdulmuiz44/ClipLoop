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
export declare class ClipLoopApiError extends Error {
    readonly status: number;
    readonly body: unknown;
    readonly requestId?: string;
    constructor(args: {
        message: string;
        status: number;
        body?: unknown;
    });
    toJSON(): {
        name: string;
        message: string;
        status: number;
        requestId: string | undefined;
    };
}
export declare class ClipLoopClient {
    readonly apiKey: string;
    readonly baseURL: string;
    constructor(options?: ClipLoopClientOptions);
    generateWeeklyPromo(input: WeeklyPromoInput, options?: ClipLoopRequestOptions): Promise<WeeklyPromoResponse>;
}
