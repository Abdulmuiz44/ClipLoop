# @talocode/cliplane-sdk

`@talocode/cliplane-sdk` is the JavaScript and TypeScript interface for ClipLane’s local-first video workflow. It creates deterministic local scripts, storyboards, export copy, placeholder render jobs, and reviewable schedule plans without requiring credentials.

## Why Use The SDK

Use the SDK when a product workflow needs ClipLane artifacts without shelling out to the CLI. Local methods keep their outputs inspectable and do not require a hosted account. The open workflow is the shipped product; a hosted worker is a separately planned architecture.

## Install

Requires Node.js 18.18 or later.

```bash
npm install @talocode/cliplane-sdk
```

## Local Quickstart

```ts
import { ClipLaneLocal } from "@talocode/cliplane-sdk";

const cliplane = new ClipLaneLocal();
const input = {
  update: "Shipped a faster export workflow",
  product: "My Product",
  audience: "builders",
  tone: "technical" as const,
};

const script = await cliplane.createScript(input);
const storyboard = await cliplane.createStoryboard(input);
const releaseCopy = await cliplane.exportForX(input);
const plan = await cliplane.createSchedule({
  runAt: "2027-01-01T12:00:00Z",
  title: "Review launch plan",
});
```

`ClipLaneLocal` writes schedules to `.cliplane/schedules.json` by default. Set `scheduleStorePath` to use a different local file.

```ts
const cliplane = new ClipLaneLocal({
  scheduleStorePath: ".cliplane/review-plans.json",
});
```

## Local API Surface

| Method | Result |
| --- | --- |
| `createScript(input)` | A local `ScriptResult` with hook, problem, shipped change, rationale, CTA, and full script |
| `createStoryboard(input)` | A local `StoryboardResult` with title, duration, and scenes |
| `exportForX(input)` | Local release copy, hook, CTA, and tags |
| `createRenderJob(input)` | A queued placeholder noting that local rendering requires an installed renderer |
| `getRenderJob(id)` | A failed placeholder because local render jobs are not persisted by this SDK |
| `createSchedule({ runAt, contentId?, title? })` | Writes a future-dated local schedule plan |
| `listSchedules()` | Returns local plans ordered by `runAt` |
| `cancelSchedule(id)` | Marks a local plan cancelled |

`createRenderJob` is not a renderer and does not produce media. Use the [ClipLane CLI](../cliplane-cli/README.md) for the shipped local FFmpeg render workflow, which writes the MP4 and a manifest under `.cliplane/renders/`.

## Scheduling, Publishing, And Security

Local schedules are plans only. They do not start a background worker, execute at `runAt`, publish content, make network requests, or store secrets. The schedule file contains only job metadata such as IDs, optional titles and content IDs, status, and timestamps.

`ClipLaneLocal` has no API-key requirement. Keep any rendered media, scripts, and schedule data under the project access controls appropriate for your release material.

## Hosted Target Architecture

The planned Talocode capability boundary is:

```text
TALOCODE_BASE_URL=https://api.talocode.site
Authorization: Bearer $TALOCODE_API_KEY
/v1/cliplane/*
```

`ClipLane` uses `TALOCODE_API_KEY` (or its `apiKey` option) and calls the `/v1/cliplane` namespace. Hosted render, scheduling, and publishing availability depends on the Talocode API deployment.

## Development And Testing

```bash
npm install
npm run build
npm run typecheck
npm test
```

## Related Packages

| Package | Install |
| --- | --- |
| [ClipLane CLI](../cliplane-cli/README.md) | `npm i -g @talocode/cliplane-cli` |
| ClipLane SDK | `npm i @talocode/cliplane-sdk` (this package) |
| [ClipLane MCP](../cliplane-mcp/README.md) | `npm i -g @talocode/cliplane-mcp` |
| ClipLane Python | `pip install talocode-cliplane` |

## Talocode Ecosystem

| Product | Package |
| --- | --- |
| [ClipLane](https://github.com/talocode/cliplane) | `npm i @talocode/cliplane-sdk` (this package) |
| [Tera](https://github.com/talocode/tera) | `pip install talocode-tera` |
| [Codra](https://github.com/talocode/codra) | `pip install talocode-codra` |
| [SearchLane](https://github.com/talocode/searchlane) | `pip install talocode-searchlane` |
| [StackLane](https://github.com/talocode/stacklane) | `pip install talocode` |
| [GateLane](https://github.com/talocode/gatelane) | - |
| [ContextLane](https://github.com/talocode/contextlane) | `pip install contextlane` |
| [ScreenLane](https://github.com/talocode/screenlane) | `pip install talocode-screenlane` |
| [MemoryLane](https://github.com/talocode/memorylane) | - |
| [Tradia](https://github.com/talocode/tradia) | `pip install tradia` |
| [DevTool](https://github.com/talocode/devtool) | `pip install talocode-devtool` |
| [XProLane](https://github.com/talocode/xprolane) | `pip install talocode-xprolane` |
| [XSearchLane](https://github.com/talocode/xsearchlane) | `npm i @talocode/xsearchlane` |
| [Agent Browser](https://github.com/talocode/agent-browser) | - |
| [InvoiceLane](https://github.com/talocode/invoicelane) | - |
| [GeoLane](https://github.com/talocode/geolane) | - |

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)

## Links

[Repository](https://github.com/talocode/cliplane) · [Documentation](https://docs.talocode.site) · [Talocode](https://talocode.site)

## License

MIT © Talocode.
