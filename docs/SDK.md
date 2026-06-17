# ClipLoop SDK

The ClipLoop SDK lets developers integrate ClipLoop into apps, dashboards, agents, and automation workflows.

## Install

```bash
npm install @talocode/cliploop-sdk
```

## Core promise

Turn product updates into short-form promo video workflows from code.

## Local-first by default

Use `ClipLoopLocal` when you want deterministic local generation without any API key.

Hosted rendering is optional.

## Hosted API

If you provide `apiKey`, the SDK can call the hosted ClipLoop API at `https://api.cliploop.site` by default.

You can override the base URL for local development or private deployments.

## Methods

- `createScript(input)`
- `createStoryboard(input)`
- `createRenderJob(input)`
- `getRenderJob(id)`
- `exportForX(input)`

