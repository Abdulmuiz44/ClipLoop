# @cliploop/sdk

> ClipLoop TypeScript SDK for server-side integration with Talocode Cloud.

Use this SDK server-side only. Do not use it in browser apps that ship to end users.

## Install

```bash
npm install @cliploop/sdk
```

## Environment

```bash
# Primary (required for Talocode Cloud hosted API)
export TALOCODE_API_KEY="your-talocode-cloud-key"
export TALOCODE_BASE_URL="https://api.talocode.site"

# Legacy (deprecated — use TALOCODE_API_KEY instead)
# export CLIPLOOP_API_KEY="your-dashboard-key"
```

## Usage

### Generate a Weekly Promo (legacy app API)

```ts
import { ClipLoopClient } from "@cliploop/sdk";

const client = new ClipLoopClient();

const result = await client.generateWeeklyPromo({
  appName: "FounderOS",
  appWebsiteUrl: "https://founderos.com",
  weeklyUpdate: "Added revenue dashboard and AI reminders.",
  targetAudience: "Founders",
  callToAction: "Join waitlist",
  channel: "x",
  tone: "Excited"
});

console.log(result.downloadUrl);
```

### Talocode Cloud hosted API

```ts
import { ClipLoopClient } from "@cliploop/sdk";

const client = new ClipLoopClient();

// Generate a brief
const brief = await client.generateBrief({ prompt: "Weekly promo", channel: "twitter", tone: "professional" });
console.log(brief.data.briefId);

// Generate a script from a brief
const script = await client.generateScript({ briefId: brief.data.briefId });
console.log(script.data.scriptId);

// Render a video from a script
const render = await client.renderVideo({ scriptId: script.data.scriptId, format: "portrait" });
console.log(render.data.renderId);

// Create a campaign
const campaign = await client.createCampaign({ name: "Q3 Promo", platform: "tiktok", schedule: "2026-07-15" });
console.log(campaign.data.campaignId);

// Package a campaign
const packaged = await client.packageCampaign({ campaignId: campaign.data.campaignId });
console.log(packaged.data.packageId);
```

## API Key Migration

`CLIPLOOP_API_KEY` is **deprecated**. Use `TALOCODE_API_KEY` for all hosted ClipLoop API access via Talocode Cloud.

The SDK reads `TALOCODE_API_KEY` first, falling back to `CLIPLOOP_API_KEY` only for backward compatibility. A deprecation warning is emitted when the legacy key is used.

## Security warning

This SDK sends API keys to Talocode Cloud from the machine or process using it. Never call it from a browser bundle or public frontend. Keep keys on the server.

## Related

- Talocode Cloud: https://api.talocode.site
- Talocode Cloud SDK: `@talocode/sdk` (available as `@stacklane/sdk`)
- Developer docs: https://docs.cliploop.site/sdks/
- Weekly Promo API: https://docs.cliploop.site/weekly-promo-api/
- API keys: https://docs.cliploop.site/api-keys/
