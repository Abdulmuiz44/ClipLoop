# @talocode/cliplane-sdk

ClipLane is an open-source, local-first video workflow layer for builders and developers. It turns product updates into scripts, storyboards, X export copy, and reviewable local schedule plans without credentials.

## Install

```bash
npm install @talocode/cliplane-sdk
```

## Local Mode

Use `ClipLaneLocal` for deterministic local workflows.

```ts
import { ClipLaneLocal } from "@talocode/cliplane-sdk";

const cliplane = new ClipLaneLocal();
const script = await cliplane.createScript({
  update: "We shipped SignalLane v0.1.1",
  product: "SignalLane",
  audience: "builders",
});
const job = await cliplane.createSchedule({
  runAt: "2027-01-01T12:00:00Z",
  title: "Launch plan",
});
```

Local schedules are stored in `.cliplane/schedules.json`. They are workflow plans only: they do not publish content, start a worker, or use credentials.

## API Surface

- `createScript(input)`
- `createStoryboard(input)`
- `createRenderJob(input)`
- `getRenderJob(id)`
- `exportForX(input)`
- `createSchedule(input)`
- `listSchedules()`
- `cancelSchedule(id)`

## Hosted Compatibility

`ClipLoop` remains exported solely as a legacy compatibility client for the existing hosted ClipLoop API, including its hosted render and scheduling routes. It uses `CLIPLOOP_API_KEY` and `https://api.cliploop.site`; these are not ClipLane local-first interfaces.

## Package

- Name: `@talocode/cliplane-sdk`
- Version: `0.1.0`
