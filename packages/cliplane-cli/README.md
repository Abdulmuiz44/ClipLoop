# ClipLane CLI

`@talocode/cliplane-cli` is the local command-line workflow for turning a product update into a script, storyboard, rendered MP4, and release copy. It exists so launch-video work can remain reviewable files in the project rather than an opaque remote job.

## Install

Requires Node.js 18.18 or later and an FFmpeg executable on `PATH` for rendering.

```bash
npm install -g @talocode/cliplane-cli
```

## Quickstart

```bash
cliplane init
cliplane script --update "Shipped a faster export workflow"
cliplane storyboard --script .cliplane/scripts/latest.md
cliplane render
cliplane export x
```

## Commands

| Command | Description |
| --- | --- |
| `cliplane init [--force]` | Creates `.cliplane/` and its configuration |
| `cliplane script --update "..."` | Creates `scripts/latest.md` |
| `cliplane storyboard [--script path]` | Creates `storyboards/latest.json` |
| `cliplane render` | Renders the latest storyboard with the local FFmpeg pipeline |
| `cliplane export x` | Prints release copy and a checklist; it does not publish |
| `cliplane doctor` | Checks workspace and renderer prerequisites |
| `cliplane schedule create --at "..." [--content id] [--title "..."]` | Saves a local schedule plan |
| `cliplane schedule list` or `status` | Reads local plans |
| `cliplane schedule cancel --id schedule_...` | Cancels a local plan |

Set `CLIPLANE_RENDERER=remotion` to build the adapter storyboard before the current FFmpeg render step. The rendered MP4 and a JSON manifest are written to `.cliplane/renders/`.

## Local Storage And Scheduling

The CLI writes only to the current project’s `.cliplane/` directory: configuration, scripts, storyboards, renders, and `schedules.json`. Schedule entries are local plans with a future `runAt` timestamp. They do not launch a worker, publish media, contact a remote service, or retain credentials.

No API key or login is needed for the local workflow. Rendered media and generated content are your project data; protect or exclude them using the same policies you use for other release assets.

## Hosted Architecture

The intended Talocode hosted boundary is `TALOCODE_BASE_URL=https://api.talocode.site` under `/v1/cliplane/*`, authenticated with `TALOCODE_API_KEY`. That architecture is for a future hosted worker that could receive rendered-media, scheduling, and publishing jobs. It is not currently a shipped CLI feature and must not be confused with `schedules.json`.

## Development And Testing

```bash
npm install
npm run build
npm test
npm run clean
```

## Related Packages

| Package | Install |
| --- | --- |
| ClipLane CLI | `npm i -g @talocode/cliplane-cli` (this package) |
| [ClipLane SDK](../cliplane-sdk/README.md) | `npm i @talocode/cliplane-sdk` |
| [ClipLane MCP](../cliplane-mcp/README.md) | `npm i -g @talocode/cliplane-mcp` |
| ClipLane Python | `pip install talocode-cliplane` |

## Talocode Ecosystem

| Product | Package |
| --- | --- |
| [ClipLane](https://github.com/talocode/cliplane) | `npm i -g @talocode/cliplane-cli` (this package) |
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
