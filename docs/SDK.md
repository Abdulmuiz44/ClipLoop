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

If you provide `apiKey`, the SDK can call the hosted ClipLane API at `https://api.cliplane.site` by default.

You can override the base URL for local development or private deployments.

## Methods

- `createScript(input)`
- `createStoryboard(input)`
- `createRenderJob(input)`
- `getRenderJob(id)`
- `exportForX(input)`

