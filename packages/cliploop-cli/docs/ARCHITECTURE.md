# ClipLoop Architecture

ClipLoop is a workflow layer, not a model.

## Shape

```text
product update -> script -> storyboard -> scenes -> render -> mp4 export
```

## Runtime surfaces

- `cliploop init` creates local workspace folders in `.cliploop/`
- `cliploop script` turns an update into a short promo script
- `cliploop storyboard` converts that script into a simple scene plan
- `cliploop render` produces a clean MP4 with a dark/white Talocode style
- `cliploop export x` prepares release copy and a demo checklist
- `cliploop doctor` validates the workspace

## Design goals

- local-first
- no hosted dependency
- no login
- no scraping
- no model training
- no auto-posting
- small, inspectable outputs

## Workspace layout

```text
.cliploop/
  config.json
  scripts/
  storyboards/
  renders/
```

## Render model

v0.1.0 ships a deterministic FFmpeg renderer. The package also keeps a Remotion adapter boundary so the rendering backend can grow later without changing the CLI shape.
