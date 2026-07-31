# ClipLane Providers

ClipLane separates the workflow from the render backend.

## v0.1.0 shipped

- `providers/remotion.ts` boundary
- `providers/ffmpeg.ts` deterministic fallback renderer

## Planned later

- ComfyUI
- LTX / LTX-2
- HunyuanVideo
- Wan-style models
- optional API providers
- Seedance-compatible adapter surface

## Rules

- Providers must be local-first by default.
- Providers must not require login for the v0.1.0 CLI.
- Providers must not claim model capabilities that are not actually implemented.
- Provider outputs should stay portable: scene data in JSON, render artifacts in MP4.
