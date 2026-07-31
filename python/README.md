# Talocode ClipLane

Talocode ClipLane creates, lists, and cancels local promo-video schedule plans stored in JSON. It provides a safe, reviewable release plan without credentials, a network connection, or automatic publishing.

## Why ClipLane

ClipLane keeps the planning layer open and local while Talocode Cloud can provide optional hosted capabilities where teams need them. Local schedule records are workflow plans only: this package does not run a worker, publish content, or integrate with external publishing services.

## Install

```bash
pip install talocode-cliplane
```

## Quickstart

```python
from cliplane import LocalScheduleClient

cliplane = LocalScheduleClient()  # .cliplane/schedules.json
job = cliplane.create_schedule(
    "2027-01-01T12:00:00Z",
    content_id="launch-video",
    title="Launch review plan",
)

print(job.id)
print(cliplane.list_schedules())
cliplane.cancel_schedule(job.id)
```

## Local Store And Auth

`LocalScheduleClient` defaults to `.cliplane/schedules.json`; pass `store_path` to choose another local file. The JSON format is shared with the ClipLane CLI, SDK, and MCP server. No secrets are read or written.

Hosted Talocode capabilities, when used by other clients, use `TALOCODE_API_KEY` with `TALOCODE_BASE_URL`, which defaults to `https://api.talocode.site`. This local package does not make hosted requests.

## API Surface

| Method | Purpose |
| --- | --- |
| `create_schedule(run_at, content_id=None, title=None)` | Creates a future local schedule plan |
| `list_schedules()` | Lists plans ordered by run time |
| `cancel_schedule(schedule_id)` | Marks a plan cancelled |

The local API has no credit charges. It does not publish content.

## CLI

```bash
cliplane schedule-create --at "2027-01-01T12:00:00Z" --content launch-video --title "Launch review"
cliplane schedule-list
cliplane schedule-cancel schedule_your_id
```

Use `--store path/to/schedules.json` before the command to select a different JSON file.

## Related Packages

| Package | Install |
| --- | --- |
| ClipLane CLI | `npm i @talocode/cliplane-cli` |
| ClipLane SDK | `npm i @talocode/cliplane-sdk` |
| Talocode ClipLane | `pip install talocode-cliplane` |

## Talocode ecosystem

| Product | Package |
| --- | --- |
| [ClipLane](https://github.com/talocode/cliplane) | `pip install talocode-cliplane` (this package) |
| [Tera](https://github.com/talocode/tera) | `pip install talocode-tera` |
| [Codra](https://github.com/talocode/codra) | `pip install talocode-codra` |
| [SearchLane](https://github.com/talocode/searchlane) | `pip install talocode-searchlane` |
| [StackLane](https://github.com/talocode/stacklane) | `pip install talocode` |
| [ContextLane](https://github.com/talocode/contextlane) | `pip install contextlane` |
| [Tradia](https://github.com/talocode/tradia) | `pip install tradia` |
| [XSearchLane](https://github.com/talocode/xsearchlane) | `npm i @talocode/xsearchlane` |
| [Agent Browser](https://github.com/talocode/agent-browser) | Hosted capability |

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)

## Links

[GitHub](https://github.com/talocode/cliplane) · [Docs](https://docs.talocode.site) · [PyPI](https://pypi.org/project/talocode-cliplane/) · [npm CLI](https://www.npmjs.com/package/@talocode/cliplane-cli) · [npm SDK](https://www.npmjs.com/package/@talocode/cliplane-sdk)

## License

MIT © Talocode
