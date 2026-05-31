# @cliploop/sdk

> Local ClipLoop TypeScript SDK. `npm install @cliploop/sdk` is coming soon.

Use this SDK server-side only. Do not use it in browser apps that ship to end users.

## Install

```bash
npm install @cliploop/sdk
```

## Usage

Set your API key in your environment.

```bash
export CLIPLOOP_API_KEY="your-dashboard-key"
```

Use the client from a server, backend job, or secure worker.

```ts
import { ClipLoopClient } from "@cliploop/sdk";

const client = new ClipLoopClient();

const result = await client.generateWeeklyPromo({
  appName: "FounderOS",
  appWebsiteUrl: "https://founderos.com",
  weeklyUpdate: "Added revenue dashboard and AI reminders.",
  targetAudience: "Founders",
  callToAction: "Join waitlist",
  channel: "Instagram Reels",
  tone: "Excited"
});

console.log(result.downloadUrl);
```

## Security warning

This SDK sends API keys to ClipLoop from the machine or process using it. Never call it from a browser bundle or public frontend. Keep keys on the server.

## Related

- Developer docs: https://docs.cliploop.site/sdks/
- Weekly Promo API: https://docs.cliploop.site/weekly-promo-api/
- API keys: https://docs.cliploop.site/api-keys/
