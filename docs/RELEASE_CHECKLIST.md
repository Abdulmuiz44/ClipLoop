# Release And Verification Checklist

Use this checklist before publishing a ClipLane package release or announcing a workflow change.

## Product Contract

- [ ] Local CLI, SDK, MCP, and Python docs agree on what is locally available.
- [ ] Planned hosted capabilities are labeled as planned and do not appear as shipped local behavior.
- [ ] No local scheduling documentation implies automatic publishing or credential storage.

## First Result

- [ ] `examples/local-launch-workflow.sh` completes in a clean project with Node.js and FFmpeg installed.
- [ ] The run creates a script, storyboard, MP4, manifest, and export-copy output under `.cliplane/`.
- [ ] The rendered MP4 and script claims have been reviewed before any public use.

## Surface Checks

- [ ] CLI: `npm test` in `packages/cliplane-cli`.
- [ ] SDK: `npm run typecheck && npm test` in `packages/cliplane-sdk`.
- [ ] MCP: `npm test` in `packages/cliplane-mcp`.
- [ ] Python: `python -m unittest discover -s tests` in `python`.
- [ ] Root app: run relevant build, lint, and billing checks when root application behavior changes.

## Documentation And Release

- [ ] Root README, package README, first-result guide, and troubleshooting guide reflect the change.
- [ ] CLI, SDK, MCP, and Python package versions are intentionally selected and release notes are accurate.
- [ ] Published package metadata includes the intended files and README.
- [ ] No secrets, generated media, `.cliplane/` workspace data, or local environment files are staged.
- [ ] The announcement links to one working workflow or tutorial and makes no unavailable capability claims.
