# Troubleshooting

## `cliplane` Is Not Found

Install the CLI, then open a new shell so the global package bin directory is available:

```bash
npm install -g @talocode/cliplane-cli
cliplane --help
```

## Rendering Fails

Rendering uses the local FFmpeg executable. Confirm it is installed and visible on `PATH`:

```bash
ffmpeg -version
cliplane doctor
```

If `cliplane doctor` reports a workspace problem, run `cliplane init` from the project directory before creating a script or storyboard.

## A Schedule Did Not Publish

This is expected. `.cliplane/schedules.json` is a local review-plan store. It does not run jobs, connect an account, publish media, or retain credentials. Use it as a handoff artifact until hosted publishing is explicitly available.

## The Generated Claim Is Not Accurate

Edit `.cliplane/scripts/latest.md`, then regenerate the storyboard with the script path:

```bash
cliplane storyboard --script .cliplane/scripts/latest.md
```

Review the resulting storyboard and render before sharing the final media.

## Hosted Requests Fail

Hosted ClipLane capabilities depend on the Talocode API deployment. Do not configure a local CLI workflow to expect `/v1/cliplane/*` to render, schedule, or publish automatically. When a hosted capability is available, use `TALOCODE_API_KEY` only in secret-managed environments and never in browser code or committed files.
