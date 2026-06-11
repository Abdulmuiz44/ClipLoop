# ClipLoop Video Pipeline Architecture

Architecture for ClipLoop as a **short-form promo video engine for indie apps**, informed by [video-use](https://github.com/browser-use/video-use) patterns.  
**Research reference:** LaunchPix `docs/research/VIDEO_USE_ARCHITECTURE_NOTES.md`  
**Status:** Planning — docs only, no production implementation in this pass.

---

## Design principle

**Do not throw raw media at the model.**

Convert video and product inputs into structured context the LLM can reason over:

- Script outline, scene plan, shot list, captions, timing map, assets list
- Word-level transcript + packed phrases when demo footage is supplied
- Timeline composites on demand for QA — not continuous frame streaming

This mirrors Agent Browser (DOM over screenshots) and video-use (transcript over frames).

---

## What ClipLoop is becoming

| Was (wedge) | Becomes (engine) |
|-------------|------------------|
| Weekly promo one-shot | Recurring promo automation |
| Slideshow-style renders | Scene-plan + EDL-driven composition |
| Fire-and-forget API | Plan → render → self-eval → publish → learn |

ClipLoop is **not** a browser-based NLE. It is an API-first promo engine with a dashboard operator surface.

---

## End-to-end pipeline

```
Ingest
  ↓
Analyze
  ↓
Plan edit
  ↓
Generate EDL / timeline
  ↓
Render
  ↓
Self-evaluate
  ↓
Publish
  ↓
Learn from metrics
```

### Detailed flow

```
┌─────────────────────────────────────────────────────────────────┐
│ INGEST                                                          │
│  product URL · changelog · screenshots · demo clips · brand     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ ANALYZE                                                         │
│  project memory snapshot · website context · optional transcript │
│  → promo_context.md (packed structured reading view)            │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PLAN                                                            │
│  promo brief · script · scene plan · caption chunks             │
│  → user confirm (chat/dashboard) or auto for API tier           │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ EDL / TIMELINE                                                  │
│  edl.json: beats, segments, durations, assets, transitions     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ RENDER                                                          │
│  HyperFrames scenes · FFmpeg stitch · subtitles · thumbnail   │
│  → preview.mp4 → final.mp4                                      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ SELF-EVAL                                                       │
│  timeline composites at cuts · duration check · caption QA      │
│  → eval_report.json (max 3 fix passes)                          │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PUBLISH                                                         │
│  schedule · platform adapters · tracking slug                   │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ LEARN                                                           │
│  metrics rollup · winner/loser classification · next cycle      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Inputs

| Input | Required | Source today |
|-------|----------|--------------|
| Product URL | Recommended | `extractWebsiteText`, project settings |
| Changelog / update | Optional | User input, future integrations |
| Screenshots / demo clips | Optional | Uploads, scrape |
| Brand profile | Yes | `project_memory_snapshots` |
| Target audience | Yes | Project settings, strategy cycle |
| Channel (IG/TikTok/etc.) | Yes | `WeeklyPromoInput.channel` |

---

## Structured artifacts (planned)

Each generation run produces a versioned artifact bundle under `renders/<job_id>/` (analogous to video-use `edit/`):

| Artifact | Purpose | Status |
|----------|---------|--------|
| `promo_brief.json` | Angle, hook, CTA, week theme, must-include | **PR 2** |
| `promo_context.md` | Packed reading view for LLM (product + script + timing) | **PR 2** |
| `weekly_promo_script.json` | Hook, body, caption, CTA | **Exists** |
| `scene_plan.json` | `SceneBlock[]` timing and overlays | **Exists** |
| `edl.json` | Unified edit contract: segments, beats, asset refs | **PR 3** |
| `assets_manifest.json` | Screenshots, logo, clip paths | **PR 3** |
| `takes_packed.md` | Word-level transcript pack (when footage supplied) | **PR 3** |
| `captions.srt` | Output-timeline subtitles | **PR 4** |
| `preview.mp4` / `final.mp4` | Render outputs | **Exists** (partial) |
| `eval_report.json` | Self-eval pass/fail per check | **PR 5** |
| `generation_session.md` | Session memory for iteration | **PR 5** |

---

## Processing stages

### 1. Create promo brief

Deterministic + LLM: synthesize from project memory, website context, and optional changelog. Output `promo_brief.json` with angle, hook direction, CTA, and constraints (length, channel, tone).

### 2. Generate script

Existing `weeklyPromoScriptSchema` flow in `src/domains/weekly-promo/service.ts`. Structured JSON output validated by schema.

### 3. Create scene plan

Existing `generateScenePlan` → `SceneBlock[]`. Evolve toward EDL-compatible segment list with explicit `start`, `end`, `beat`, `assetRef`.

### 4. Asset collection

Resolve screenshots from project, uploaded demo clips, logo. Manifest records provenance for render and self-eval.

### 5. Transcript pack (conditional)

When user supplies talking-head or screen recording with audio:

- Transcribe with word-level timestamps (cache per source file)
- Pack to `takes_packed.md` phrase view
- Use for cut boundaries if clip is trimmed into promo

Skip for pure slideshow promos (current default).

### 6. Generate EDL / timeline

`edl.json` becomes the handoff between planning and rendering:

```json
[
  {
    "segmentId": "s01",
    "type": "slide",
    "beat": "HOOK",
    "duration": 3.5,
    "assetRef": "screenshot_hero.png",
    "captionChunks": ["SHIP FASTER", "THIS WEEK"],
    "transition": "fade"
  }
]
```

For footage segments, add `source`, `start`, `end` (word-boundary snapped) per video-use EDL shape.

### 7. Caption generation

Channel-aware chunking (2-word uppercase for TikTok/IG, sentence mode for LinkedIn). Output-timeline offsets after concat — hard rule from video-use.

### 8. Render

Existing stack:

- **HyperFrames** for scene composition (`hyperframesRenderAdapter`)
- **FFmpeg** for stitch, fades, subtitle burn-in
- Per-segment extract → concat pattern when mixing footage clips

Output: `preview.mp4` (fast/low-res) then `final.mp4`.

### 9. Self-evaluate

Before surfacing to user:

| Check | Method |
|-------|--------|
| Cut boundary continuity | Timeline composite at each segment edge |
| Duration vs EDL | `ffprobe` |
| Subtitle readability | Sample frames at caption peaks |
| Brand consistency | Color/logo presence heuristic |
| Audio pop (if voiceover) | Waveform spike at boundaries |

Fix → re-render → re-eval. Cap at 3 passes. Write `eval_report.json`.

### 10. Schedule / publish

Existing `publish_content_item` job queue and channel adapters. User review gate before auto-publish (dashboard).

### 11. Track metrics

Existing tracking domain: slug, clicks, conversions, `compute_performance_rollup`, `generate_iteration_cycle`.

---

## Outputs

| Output | Consumer |
|--------|----------|
| `final.mp4` | API download, publish adapters |
| `captions.srt` + burned-in | Platform upload |
| Thumbnail | API, social preview |
| Post copy | Caption + platform variants from script |
| Analytics record | Dashboard, iteration engine |

---

## Mapping to existing domains

| Domain | Pipeline role |
|--------|---------------|
| `projects` + `memory` | Ingest, analyze — project truth |
| `strategy` | Weekly angle, hooks — feeds promo brief |
| `content-items` | Script + render state per post |
| `rendering` | EDL → MP4 |
| `publishing` | Schedule, platform publish |
| `metrics` + `iterations` | Learn loop |
| `weekly-promo` | High-level orchestration (evolve to full pipeline) |
| `job_queue` | Async stages: plan, render, eval, publish, rollup |

### Job types (planned extensions)

| Job type | Stage |
|----------|-------|
| `generate_promo_brief` | Plan |
| `render_content_item` | Render (exists) |
| `self_eval_content_item` | Self-eval |
| `publish_content_item` | Publish (exists) |
| `compute_performance_rollup` | Learn (exists) |

---

## API surfaces

### Current

- `POST /api/public/weekly-promo` — inline generate + render
- Dashboard chat generate flows

### Planned

- `POST /api/public/videos/generate` — generic EDL-driven generation
- `GET /api/public/videos/:id` — poll status including `self_eval` phase
- Async job model per `docs-site/video-jobs/`

---

## Hard rules (from video-use, adapted)

Production correctness for ClipLoop renders:

1. Subtitles applied **last** in filter chain (after overlays)
2. Per-segment extract → lossless concat when mixing footage
3. Audio fades at segment boundaries when voiceover present
4. Never cut inside a word when trimming footage
5. Caption timestamps use **output-timeline** offsets post-concat
6. Cache transcripts per source file; re-transcribe only on source change
7. Self-eval before user sees preview (max 3 fix passes)
8. Generation artifacts in `renders/<job_id>/`, not mixed into skill/tool dirs

Creative freedom elsewhere: template choice, grade, pacing, hook style, animation palette.

---

## Implementation sequence

| PR | Deliverable |
|----|-------------|
| **PR 1** | This architecture doc |
| PR 2 | `promo_brief.json` schema + `promo_context.md` packer |
| PR 3 | `edl.json` schema unified with `SceneBlock` |
| PR 4 | Render worker: EDL in → FFmpeg/HyperFrames out |
| PR 5 | Self-eval checks + `eval_report.json` |
| PR 6 | Weekly schedule/publish loop wiring |
| PR 7 | Metrics → strategy feedback loop |

---

## Related docs

- `docs/ARCHITECTURE.md` — two-surface split + backend domains
- `ARCHITECTURE.md` (repo root) — open-core layer map
- `docs/PRODUCT_DIRECTION.md` — API-first vision
- LaunchPix `docs/research/VIDEO_USE_ARCHITECTURE_NOTES.md` — full research notes