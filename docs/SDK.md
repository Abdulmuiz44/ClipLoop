# ClipLane SDK

The ClipLane SDK lets developers integrate ClipLane into apps, dashboards, agents, and automation workflows.

## Install

```bash
npm install @talocode/cliplane-sdk
```

## Core promise

Turn product updates into short-form promo video workflows from code.

## Local-first by default

Use `ClipLaneLocal` when you want deterministic local generation without any API key.

Hosted rendering is optional.

## Hosted API

If you provide `apiKey` (or set `TALOCODE_API_KEY`), the SDK calls the hosted ClipLane API at `https://api.talocode.site` by default, using `/v1/cliplane/*`.

You can override the base URL for local development or private deployments.

## Methods

- `createScript(input)`
- `createStoryboard(input)`
- `createRenderJob(input)`
- `getRenderJob(id)`
- `exportForX(input)`
