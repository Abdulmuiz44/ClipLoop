# ClipLane Local Schedule MCP

This minimal stdio server exposes `cliplane_create_schedule`, `cliplane_list_schedules`, and `cliplane_cancel_schedule` for local ClipLane workflow plans. It stores plans in `.cliplane/schedules.json` by default, or in the file selected by `CLIPLANE_SCHEDULE_STORE`.

The server has no network calls, credentials, background execution, or publishing integration. Hosted scheduling is a separate optional API capability; this server only records plans for review and later workflow execution.

Run it with:

```bash
node server.js
```
