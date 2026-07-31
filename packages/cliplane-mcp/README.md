# ClipLane MCP

ClipLane MCP gives AI agents local, reviewable schedule planning tools. It creates, lists, and cancels plans in `.cliplane/schedules.json` without credentials, network access, or automatic publishing.

## Install

```bash
npm i -g @talocode/cliplane-mcp
```

## Tools

- `cliplane_create_schedule`
- `cliplane_list_schedules`
- `cliplane_cancel_schedule`

Run the stdio server with `cliplane-mcp`.

## Local Data

Set `CLIPLANE_SCHEDULE_STORE` to select another local schedule file. Plans require review and do not publish content automatically.

## Related Packages

| Package | Install |
| --- | --- |
| ClipLane CLI | `npm i @talocode/cliplane-cli` |
| ClipLane SDK | `npm i @talocode/cliplane-sdk` |
| ClipLane Python | `pip install talocode-cliplane` |

## Talocode ecosystem

| Product | Package |
| --- | --- |
| [ClipLane](https://github.com/talocode/cliplane) | `npm i @talocode/cliplane-mcp` (this package) |
| [Tera](https://github.com/talocode/tera) | `pip install talocode-tera` |
| [Codra](https://github.com/talocode/codra) | `pip install talocode-codra` |
| [SearchLane](https://github.com/talocode/searchlane) | `pip install talocode-searchlane` |
| [StackLane](https://github.com/talocode/stacklane) | `pip install talocode` |
| [ContextLane](https://github.com/talocode/contextlane) | `pip install contextlane` |
| [Tradia](https://github.com/talocode/tradia) | `pip install tradia` |

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)

## License

MIT © Talocode
