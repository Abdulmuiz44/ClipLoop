# ClipLane

ClipLane is not a foundation video model. It is an open-source workflow layer for turning product updates into promo videos. Local commands work without credentials; hosted capabilities are optional and separate.

## What it does

Workflow:

1. Product update
2. Script
3. Storyboard
4. Remotion scenes
5. FFmpeg or Remotion render
6. MP4 export

## Install

```bash
npm install -g @talocode/cliplane-cli
```

## Commands

```bash
cliplane --version
cliplane init
cliplane script --update "we shipped Codra v0.1.5"
cliplane storyboard --script .cliplane/scripts/latest.md
cliplane render
cliplane export x
cliplane doctor
cliplane schedule create --at "2027-01-01T12:00:00Z" --content launch-video --title "Launch plan"
cliplane schedule status
cliplane schedule cancel --id schedule_...
```

## Local storage

ClipLane keeps its working files inside `.cliplane/`:

- `config.json`
- `scripts/`
- `storyboards/`
- `renders/`
- `schedules.json` - local workflow plans only; it never contains credentials or triggers publishing

## What ships in v0.1.0

- local project initialization
- update-to-script generation
- script-to-storyboard generation
- FFmpeg render pipeline for a clean dark/white promo video
- X export helper for release sharing
- workspace doctor

## Planned providers

- Remotion adapter
- FFmpeg fallback
- ComfyUI adapter
- LTX / LTX-2 adapter
- HunyuanVideo adapter
- Wan-style model adapter
- optional API providers

## Notes

- No login required.
- No hosted service required.
- No auto-posting.
- No scraping.
- No model training.
- No fake model claims.
- Schedules are local plans, not a background worker or publishing integration. Hosted scheduling remains an optional API capability when configured separately.
