# ClipLane

ClipLane is an open-source, local-first workflow for turning product updates into short-form promo-video assets. It keeps the plan, script, storyboard, rendered media, and schedule plans in your project so they can be reviewed before anything leaves your machine.

## Why ClipLane

Product teams often have the source material for launch content but not a repeatable path from a release note to a video. ClipLane provides that path as local files and commands: draft a script, turn it into a storyboard, render an MP4, and prepare release copy. The open workflow is useful on its own; hosted capability is a separate future architecture, not a requirement for local use.

## Local-First Workflow

```bash
npm install -g @talocode/cliplane-cli
cliplane init
cliplane script --update "Shipped a faster export workflow"
cliplane storyboard --script .cliplane/scripts/latest.md
cliplane render
cliplane export x
```

`cliplane init` creates a `.cliplane/` workspace in the current project:

| Path | Purpose |
| --- | --- |
| `config.json` | Local project metadata detected during initialization |
| `scripts/latest.md` | Generated local script |
| `storyboards/latest.json` | Structured scene plan |
| `renders/` | MP4 output and a render manifest |
| `schedules.json` | Reviewable local schedule plans |

The CLI renders locally with the installed FFmpeg executable. A render manifest records the selected renderer, output path, scenes, and creation time alongside the media. `CLIPLANE_RENDERER=remotion` can build the adapter storyboard, but the current CLI still renders through FFmpeg. Ensure FFmpeg is installed and available on `PATH` before rendering.

## Scheduling And Publishing Boundaries

Local schedule commands and SDK methods write entries to `.cliplane/schedules.json`. They validate that `runAt` is a future ISO-8601 timestamp, but they do not start a background worker, wake at the requested time, publish media, connect an account, or store credentials. They are plans for review and handoff.

The target hosted architecture is the Talocode API namespace:

```text
TALOCODE_BASE_URL=https://api.talocode.site
/v1/cliplane/*
```

That future hosted surface would accept authenticated render, scheduling, and publishing work and execute it in a hosted worker. It is not the local CLI schedule store, and it is not currently documented as a shipped public ClipLane API. Do not configure local workflows expecting it to publish automatically.

## Packages

| Package | Install | Use |
| --- | --- | --- |
| [ClipLane CLI](packages/cliplane-cli/README.md) | `npm i -g @talocode/cliplane-cli` | Local workspace, script, storyboard, render, export, and plans |
| [ClipLane SDK](packages/cliplane-sdk/README.md) | `npm i @talocode/cliplane-sdk` | Local workflow methods for JavaScript and TypeScript |
| [ClipLane MCP](packages/cliplane-mcp/README.md) | `npm i -g @talocode/cliplane-mcp` | Stdio tools for local schedule plans |
| ClipLane Python | `pip install talocode-cliplane` | Python package distribution |

## Commands

| Command | Result |
| --- | --- |
| `cliplane init [--force]` | Creates or refreshes the local workspace configuration |
| `cliplane script --update "..."` | Writes `.cliplane/scripts/latest.md` |
| `cliplane storyboard [--script path]` | Writes `.cliplane/storyboards/latest.json` |
| `cliplane render` | Renders the latest storyboard to `.cliplane/renders/` |
| `cliplane export x` | Prints release copy and a media checklist; it does not post |
| `cliplane doctor` | Checks workspace and local render prerequisites |
| `cliplane schedule create --at "..." [--content id] [--title "..."]` | Creates a local plan |
| `cliplane schedule list` or `status` | Lists local plans |
| `cliplane schedule cancel --id schedule_...` | Marks a local plan cancelled |

## Storage And Security

Local workflow data stays under `.cliplane/` by default. The CLI and local SDK require no account or API key. Schedule plans contain IDs, optional titles and content IDs, timestamps, and status only; they do not contain credentials and cannot trigger publishing. Treat rendered media and scripts as project content and use your normal source-control and access policies.

For hosted requests, use `TALOCODE_API_KEY` only in server-side or secret-management environments and send it as `Authorization: Bearer $TALOCODE_API_KEY` (or `X-Api-Key`). Never expose it in browser bundles or commit it to a repository. `TALOCODE_BASE_URL` defaults to `https://api.talocode.site`, and hosted ClipLane requests use `/v1/cliplane`.

## Development And Testing

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test:billing
```

Package checks:

```bash
cd packages/cliplane-cli && npm test
cd packages/cliplane-sdk && npm run typecheck && npm test
cd packages/cliplane-mcp && npm test
```

The root application also provides `npm run db:migrate`, `npm run db:seed`, and `npm run db:generate` for its application database. These are separate from the local `.cliplane/` workflow.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [SDK reference](docs/SDK.md)
- [Current public API notes](docs/PUBLIC_API.md)
- [Scheduling notes](docs/SCHEDULING.md)
- [Open source mission](docs/OPEN_SOURCE_MISSION.md)

## Talocode Ecosystem

| Product | Package |
| --- | --- |
| [ClipLane](https://github.com/talocode/cliplane) | `npm i @talocode/cliplane-cli` (this repo) |
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

- [Repository](https://github.com/talocode/cliplane)
- [Documentation](https://docs.talocode.site)
- [Talocode](https://talocode.site)

## License

MIT © Talocode. See [LICENSE](LICENSE).
