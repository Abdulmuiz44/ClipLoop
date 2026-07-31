# ClipLane MCP

`@talocode/cliplane-mcp` is a local stdio server that gives AI agents reviewable ClipLane schedule-planning tools. It exists to let an agent propose and manage local plans without credentials, network access, a background worker, or automatic publishing.

## Install

Requires Node.js 18.18 or later.

```bash
npm install -g @talocode/cliplane-mcp
```

Start the server over standard input/output:

```bash
cliplane-mcp
```

## Tools

| Tool | Input | Result |
| --- | --- | --- |
| `cliplane_create_schedule` | `runAt` (required future ISO-8601 timestamp), optional `contentId`, `title` | Creates a local plan |
| `cliplane_list_schedules` | None | Lists local plans ordered by time |
| `cliplane_cancel_schedule` | `id` | Marks the matching local plan cancelled |

The server supports the `initialize`, `tools/list`, and `tools/call` JSON-RPC requests over stdio.

## Local Storage And Security

Plans are stored in `.cliplane/schedules.json` relative to the process working directory. Set `CLIPLANE_SCHEDULE_STORE` to an explicit local path when the plan store belongs elsewhere:

```bash
CLIPLANE_SCHEDULE_STORE=/workspace/my-project/.cliplane/schedules.json cliplane-mcp
```

The store contains job IDs, optional titles and content IDs, timestamps, and status. It does not contain API keys or account credentials. Creating a plan does not run at the selected time, trigger a worker, render media, publish media, or contact any service. Review plans before using them in a publishing workflow.

## MCP Transports

### Local stdio MCP

This package is a local stdio server. Start `cliplane-mcp` from your project to use the schedule-planning tools and local `.cliplane/schedules.json` store. It does not make network requests or require `TALOCODE_API_KEY`.

### Hosted MCP

The hosted MCP endpoint is `https://api.talocode.site/mcp`. Authenticate it with `Authorization: Bearer $TALOCODE_API_KEY`. Hosted MCP is separate from this local stdio server; this package does not proxy requests to the hosted endpoint.

## Development And Testing

```bash
npm install
npm test
```

## Related Packages

| Package | Install |
| --- | --- |
| [ClipLane CLI](../cliplane-cli/README.md) | `npm i -g @talocode/cliplane-cli` |
| [ClipLane SDK](../cliplane-sdk/README.md) | `npm i @talocode/cliplane-sdk` |
| ClipLane MCP | `npm i -g @talocode/cliplane-mcp` (this package) |
| ClipLane Python | `pip install talocode-cliplane` |

## Talocode Ecosystem

| Product | Package |
| --- | --- |
| [ClipLane](https://github.com/talocode/cliplane) | `npm i -g @talocode/cliplane-mcp` (this package) |
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
