# ClipLane Architecture

ClipLane is a workflow layer, not a model.

## Shape

```text
product update -> script -> storyboard -> scenes -> render -> mp4 export
```

## Runtime surfaces

- `cliplane init` creates local workspace folders in `.cliplane/`
- `cliplane script` turns an update into a short promo script
- `cliplane storyboard` converts that script into a simple scene plan
- `cliplane render` produces a clean MP4 with a dark/white Talocode style
- `cliplane export x` prepares release copy and a demo checklist
- `cliplane doctor` validates the workspace

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
.cliplane/
  config.json
  scripts/
  storyboards/
  renders/
```

## Render model

v0.1.0 ships a deterministic FFmpeg renderer. The package also keeps a Remotion adapter boundary so the rendering backend can grow later without changing the CLI shape.
