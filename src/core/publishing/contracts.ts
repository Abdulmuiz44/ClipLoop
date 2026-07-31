export type PublishStrategy = "direct_instagram" | "direct_telegram" | "manual_export";

export type SchedulePublishRequest = {
  contentItemId: string;
  userId: string;
  scheduledFor: Date;
};

export type PublishExecutionRequest = {
  contentItemId: string;
  userId: string;
};
