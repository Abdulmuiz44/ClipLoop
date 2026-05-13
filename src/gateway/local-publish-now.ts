import { enqueuePublishJob, processJob } from "@/domains/publishing/service";

export async function publishNow(contentItemId: string) {
  const queued = await enqueuePublishJob(contentItemId, new Date());
  await processJob(queued.job.id);
}

