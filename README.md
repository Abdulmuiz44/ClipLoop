# ClipLoop

ClipLoop is an open-source video workflow for builders. One engine that turns product updates, raw clips, screen recordings, terminal demos, images, and scripts into edited videos for every channel. Local-first.

## What’s here

- `packages/cliploop-sdk` - the published SDK, `@talocode/cliploop-sdk`
- `packages/cliploop-cli` - the local CLI for script, storyboard, export, and render workflows
- `src` - the Next.js app and backend
- `docs` - product, API, billing, and architecture notes
- `apps/cliploop-sdk-demo-video` - the release demo video generator

## SDK quick start

```bash
npm install @talocode/cliploop-sdk
```

```ts
import { ClipLoopLocal, ClipLoop } from "@talocode/cliploop-sdk";

const local = new ClipLoopLocal();
const script = await local.createScript({
  update: "We shipped ClipLoop SDK v0.1.0",
  product: "ClipLoop",
  audience: "builders",
});

const hosted = new ClipLoop({
  apiKey: process.env.CLIPLOOP_API_KEY,
});
```

Local mode works without an API key. Hosted rendering is optional.

## Development

```bash
npm install
npm run dev
```

Other useful commands:

- `npm run build`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run test:billing`

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Open source mission](docs/OPEN_SOURCE_MISSION.md)
- [SDK docs](docs/SDK.md)
- [API docs](docs/PUBLIC_API.md)
- [Release demo video notes](docs/RELEASE_DEMO_VIDEO.md)

## Release assets

Release videos are generated locally and attached to GitHub Releases. The current SDK release demo lives at:

- `apps/cliploop-sdk-demo-video/dist/cliploop-sdk-v0.1.0-demo.mp4`

