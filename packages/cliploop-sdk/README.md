# @talocode/cliploop-sdk

ClipLoop is an open-source video workflow layer for builders and developers.

This SDK gives you a code-first way to turn product updates into short-form promo video workflows.

It is local-first by default. If you want hosted rendering or remote generation, you can optionally provide a ClipLoop API key from [cliploop.site](https://cliploop.site).

## Install

```bash
npm install @talocode/cliploop-sdk
```

## Local mode

Use `ClipLoopLocal` when you want deterministic script, storyboard, and X export generation without an API key.

```ts
import { ClipLoopLocal } from "@talocode/cliploop-sdk";

const cliploop = new ClipLoopLocal();

const script = await cliploop.createScript({
  update: "We shipped SignalLane v0.1.1",
  product: "SignalLane",
  audience: "builders",
});

console.log(script.fullScript);
```

## Hosted mode

Use `ClipLoop` when you want to call the hosted ClipLoop API.

```ts
import { ClipLoop } from "@talocode/cliploop-sdk";

const cliploop = new ClipLoop({
  apiKey: process.env.CLIPLOOP_API_KEY,
});

const job = await cliploop.createRenderJob({
  update: "We shipped Codra v0.1.5",
  format: "x-short",
});

console.log(job.id);
```

## What the SDK does

- `createScript(input)`
- `createStoryboard(input)`
- `createRenderJob(input)`
- `getRenderJob(id)`
- `exportForX(input)`

## Local-first behavior

If no API key is provided:

- scripts are generated locally
- storyboards are generated locally
- X export copy is generated locally
- hosted rendering is not attempted

## Hosted API behavior

If you provide an API key, the SDK can call:

- `POST /v1/scripts`
- `POST /v1/storyboards`
- `POST /v1/renders`
- `GET /v1/renders/:id`
- `POST /v1/exports/x`

Default base URL:

```ts
https://api.cliploop.site
```

You can override it for local development:

```ts
new ClipLoop({
  apiKey: "...",
  baseUrl: "http://localhost:3000",
});
```

## API keys

Get your ClipLoop API key at [cliploop.site](https://cliploop.site).

The SDK can generate scripts and storyboards locally without an API key.

Hosted rendering requires an API key.

## Package

- Name: `@talocode/cliploop-sdk`
- Version: `0.1.0`

