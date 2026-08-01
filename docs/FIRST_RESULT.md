# Get A First Result

ClipLane's shipped local workflow turns one product update into reviewable launch-media artifacts. It does not require an account or API key.

## Prerequisites

- Node.js 18.18 or later
- FFmpeg on `PATH` for the local render step
- `@talocode/cliplane-cli` installed globally

```bash
npm install -g @talocode/cliplane-cli
cliplane doctor
```

## Run The Example

From the product repository you want to describe:

```bash
curl -fsSL https://raw.githubusercontent.com/talocode/cliplane/main/examples/local-launch-workflow.sh | bash -s -- "Shipped a faster export workflow"
```

Or run the checked-in script from a ClipLane checkout:

```bash
bash examples/local-launch-workflow.sh "Shipped a faster export workflow"
```

The workflow creates `.cliplane/` with a script, storyboard, MP4 render, render manifest, and release-copy checklist. Review these files before sharing or publishing anything.

## What Happens Next

1. Read `.cliplane/scripts/latest.md` and correct the product claim if needed.
2. Review `.cliplane/storyboards/latest.json` before rendering again.
3. Inspect the MP4 and its render manifest under `.cliplane/renders/`.
4. Run `cliplane export x` to prepare copy. The command does not publish.

For planned publishing dates, use `cliplane schedule create --at "2027-01-01T12:00:00Z"`. Local schedules are reviewable plans only; they do not wake a worker or publish media.
