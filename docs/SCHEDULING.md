# Scheduled Publishing

Scheduled publishing is available for approved, rendered content items using the `direct_instagram` strategy and an Instagram target channel. Manual-export items and other channels are never delivered by the scheduler.

## Public API and SDK

API keys require the `content:schedule` scope and are restricted to their configured project when applicable.

| Operation | Method and path | SDK method |
| --- | --- | --- |
| Schedule | `POST /api/public/content-items/:contentItemId/schedule` | `scheduleContentItem(id, { scheduledFor })` |
| Reschedule | `PATCH /api/public/content-items/:contentItemId/schedule` | `rescheduleContentItem(id, { scheduledFor })` |
| Cancel | `DELETE /api/public/content-items/:contentItemId/schedule` | `cancelScheduledContentItem(id)` |
| Status | `GET /api/public/content-items/:contentItemId/schedule` | `getScheduleStatus(id)` |

`scheduledFor` must be an ISO 8601 timestamp with an offset and must be in the future.

## Worker

Set `SCHEDULER_SECRET` in the application environment. Invoke the worker on a regular cadence with a secret bearer token; do not expose this endpoint to browsers.

```bash
curl -X POST "$APP_URL/api/jobs/run" \
  -H "Authorization: Bearer $SCHEDULER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"limit":20}'
```

Run this command from your scheduler every minute. The worker claims due jobs atomically, uses a ten-minute lease, and retries failures after exponential delays from five minutes to one hour. Jobs that exhaust their configured attempts become `dead`.

## Current Publisher Support

Only direct Instagram publishing is scheduled. Content must be approved and have a completed render before it can be scheduled. Manual export, TikTok, and WhatsApp content remain manual workflows. The queue is at-least-once: external publisher idempotency is still required to protect against duplicate delivery after a worker lease expires during an in-flight request.
