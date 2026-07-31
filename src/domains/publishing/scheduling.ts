export const JOB_LEASE_MS = 10 * 60 * 1000;

export function assertFutureSchedule(scheduledFor: Date, now = new Date()) {
  if (!Number.isFinite(scheduledFor.getTime()) || scheduledFor.getTime() <= now.getTime()) {
    throw new Error("Scheduled time must be in the future");
  }
}

export function retryDelayMs(attempts: number) {
  return Math.min(5 * 60 * 1000 * 2 ** Math.max(0, attempts - 1), 60 * 60 * 1000);
}
