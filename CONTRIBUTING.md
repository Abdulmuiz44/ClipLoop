# Contributing To ClipLane

ClipLane accepts focused improvements to the local workflow, package APIs, documentation, tests, and examples. Keep changes small, reviewable, and truthful about what is locally available versus planned hosted capability.

## Before You Start

- Search existing issues and pull requests before starting duplicate work.
- Open an issue or discussion for a new workflow, package surface, or behavior change.
- Do not add automatic publishing, account handling, or credential storage to local schedule plans without an approved security and product design.

## Setup

The root app, CLI, SDK, MCP server, and Python package are separate surfaces. Install only the dependencies needed for the part you are changing.

```bash
npm install
cd packages/cliplane-cli && npm install
cd ../cliplane-sdk && npm install
cd ../cliplane-mcp && npm install
```

For the Python package, use a virtual environment and install the package in editable mode:

```bash
cd python
python -m venv .venv
. .venv/bin/activate
pip install -e .
```

## Required Checks

Run the checks that cover the surface you changed:

```bash
cd packages/cliplane-cli && npm test
cd packages/cliplane-sdk && npm run typecheck && npm test
cd packages/cliplane-mcp && npm test
cd python && python -m unittest discover -s tests
```

For root application changes, also run the relevant build, lint, and billing test commands from the root `package.json`.

## Documentation Rules

- Update the relevant package README and task-based guide when behavior changes.
- Keep local behavior, planned hosted behavior, and automatic publishing boundaries explicit.
- Every user-facing workflow must have a runnable first-result path and a review step.
- Never commit API keys, account credentials, rendered customer media, or generated `.cliplane/` workspace data.

## Pull Request Expectations

- Explain the user problem and the smallest behavior change that solves it.
- Include tests for behavior changes and update examples when command output or artifacts change.
- State the commands you ran and any checks that could not run.
- Keep package versions and release notes accurate when publishing changes.
