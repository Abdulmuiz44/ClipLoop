#!/usr/bin/env bash
set -euo pipefail

UPDATE="${1:-Shipped a faster export workflow}"

if ! command -v cliplane >/dev/null 2>&1; then
  printf '%s\n' "Install the CLI first: npm install -g @talocode/cliplane-cli" >&2
  exit 1
fi

cliplane init
cliplane script --update "$UPDATE"
cliplane storyboard --script .cliplane/scripts/latest.md
cliplane render
cliplane export x
