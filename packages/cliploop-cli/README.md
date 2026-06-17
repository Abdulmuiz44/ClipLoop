# ClipLoop

ClipLoop is not a foundation video model. It is an open-source workflow layer for turning product updates into promo videos.

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
npm install -g @talocode/cliploop
```

## Commands

```bash
cliploop --version
cliploop init
cliploop script --update "we shipped Codra v0.1.5"
cliploop storyboard --script .cliploop/scripts/latest.md
cliploop render
cliploop export x
cliploop doctor
```

## Local storage

ClipLoop keeps its working files inside `.cliploop/`:

- `config.json`
- `scripts/`
- `storyboards/`
- `renders/`

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
