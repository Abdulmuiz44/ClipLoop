# ClipLane Public API

Target API base URL: `https://api.talocode.site/v1/cliplane`

> This is the target Talocode API architecture. It does not indicate that every documented endpoint is deployed.

---

## Authentication

All public API endpoints require a bearer API key.

**Header:** `Authorization: Bearer <your_api_key>`

API keys are managed in the [dashboard](https://dashboard.talocode.site/products/cliplane). The raw key is shown **once** at creation — copy it immediately. Only the prefix is stored server-side.

---

## Endpoints

### Scheduled publishing

See [Scheduled Publishing](./SCHEDULING.md) for the `content:schedule` API scope, endpoints, SDK methods, worker setup, and current direct-publisher limitations.

### POST /v1/cliplane/weekly-promo

Generate a weekly promo video script + scene plan for your app. Ingest your app's website for brand-aligned content, produce a platform-optimized script and scene plan.

#### Required Headers

| Header | Description |
|--------|-------------|
| `Authorization: Bearer <api_key>` | API key with `weekly_promo:generate` scope |
| `Idempotency-Key: <unique_key>` | At least 8 characters. Replay-safe — same key returns the cached result without re-charging. |
| `Content-Type: application/json` | Standard JSON content type |

#### Request Body

```json
{
  "appName": "MyApp",
  "appWebsiteUrl": "https://myapp.com",
  "weeklyUpdate": "Launched v2 with real-time collaboration and dark mode",
  "targetAudience": "remote teams",
  "callToAction": "Try it free for 14 days",
  "channel": "tiktok",
  "tone": "energetic"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `appName` | string (2–100) | **Yes** | — | Your app or product name |
| `appWebsiteUrl` | string (URL) | No | `""` | Website URL for brand page extraction |
| `weeklyUpdate` | string (8–500) | **Yes** | — | What's new this week |
| `targetAudience` | string (1–200) | No | inherited from product context | Primary audience description |
| `callToAction` | string (1–200) | No | auto-generated | Desired CTA |
| `channel` | enum | **Yes** | — | One of: `instagram`, `tiktok`, `whatsapp`, `x` |
| `tone` | string (2–100) | No | inherited from product context | Tone of the promo (e.g., `professional`, `energetic`, `warm`) |

#### Success Response (200)

```json
{
  "artifactId": "clp_abc123",
  "previewUrl": null,
  "downloadUrl": null,
  "artifactUrl": null,
  "script": {
    "hook": "Stop scrolling if your team still uses email for project updates...",
    "body": [
      "We built MyApp for teams that move fast.",
      "Version 2 is here with real-time collaboration and dark mode."
    ],
    "caption": "Big update! MyApp v2 now has real-time collaboration and the dark mode you asked for.",
    "cta": "Try it free for 14 days at myapp.com"
  },
  "scenePlan": [
    "Scene 1: Quick-cut problem montage (email threads, missed updates)",
    "Scene 2: MyApp v2 hero shot — real-time collaboration interface",
    "Scene 3: Dark mode toggle reveal with split screen",
    "Scene 4: CTA card — 'Try MyApp Free'"
  ],
  "creditsCharged": 5,
  "idempotencyKey": "my-unique-key-123",
  "renderStatus": "renderer_unavailable"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `artifactId` | string | Unique identifier for this generated artifact |
| `previewUrl` | string \| null | Video preview URL (null when renderer unavailable) |
| `downloadUrl` | string \| null | Video download URL (null when renderer unavailable) |
| `artifactUrl` | string \| null | Artifact page URL |
| `script` | object | Generated script with hook, body (array), caption, and cta |
| `scenePlan` | string[] | Array of scene descriptions for the video |
| `creditsCharged` | number | Credits consumed (always 5) |
| `idempotencyKey` | string | Echoes the Idempotency-Key header |
| `renderStatus` | string | `"rendered"` or `"renderer_unavailable"` |

> **Note on render fallback:** If the video renderer is unavailable, the API returns **HTTP 200** with `previewUrl: null`, `downloadUrl: null`, and `renderStatus: "renderer_unavailable"`. The `script` and `scenePlan` are still generated and returned. Credits are charged for the LLM generation work.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `API_KEY_MISSING` | 401 | No `Authorization` header provided |
| `API_KEY_INVALID` | 401 | API key not found, revoked, or malformed |
| `SCOPE_DENIED` | 403 | Key is valid but lacks `weekly_promo:generate` scope |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | `Idempotency-Key` header missing or too short (< 8 chars) |
| `IDEMPOTENCY_CONFLICT` | 409 | Same idempotency key used with different request body |
| `IDEMPOTENCY_IN_PROGRESS` | 409 | Request with this idempotency key is still in progress |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit hit (3 requests per 60 seconds) |
| `CREDITS_INSUFFICIENT` | 402 | Not enough credits. Includes `bucket`, `required`, `available` fields. |
| `VALIDATION_ERROR` | 400 | Request body failed schema validation. Includes `fieldErrors`. |

Error response shape:

```json
{
  "error": "Insufficient credits. Required: 5, Available: 2.",
  "code": "CREDITS_INSUFFICIENT",
  "bucket": "video_generation",
  "required": 5,
  "available": 2
}
```

---

## Examples

### curl

```bash
curl -X POST https://api.talocode.site/v1/cliplane/weekly-promo \
  -H "Authorization: Bearer $TALOCODE_API_KEY" \
  -H "Idempotency-Key: my-unique-key-abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "MyApp",
    "appWebsiteUrl": "https://myapp.com",
    "weeklyUpdate": "Launched v2 with real-time collaboration and dark mode",
    "channel": "tiktok",
    "tone": "energetic"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch("https://api.talocode.site/v1/cliplane/weekly-promo", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TALOCODE_API_KEY}`,
    "Idempotency-Key": "my-unique-key-abc123",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    appName: "MyApp",
    appWebsiteUrl: "https://myapp.com",
    weeklyUpdate: "Launched v2 with real-time collaboration and dark mode",
    channel: "tiktok",
    tone: "energetic",
  }),
});

const data = await response.json();
console.log(data.script.hook);       // Generated hook line
console.log(data.scenePlan);          // Scene descriptions
console.log(data.creditsCharged);     // 5
console.log(data.renderStatus);       // "renderer_unavailable" or "rendered"
```

### Node.js (axios)

```javascript
import axios from "axios";

const { data } = await axios.post(
  "https://api.talocode.site/v1/cliplane/weekly-promo",
  {
    appName: "MyApp",
    appWebsiteUrl: "https://myapp.com",
    weeklyUpdate: "Launched v2 with real-time collaboration and dark mode",
    channel: "tiktok",
    tone: "energetic",
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.TALOCODE_API_KEY}`,
      "Idempotency-Key": "my-unique-key-abc123",
    },
  },
);

console.log(data.artifactId);
```

---

## Best Practices

1. **Always use Idempotency-Key.** Generate a unique key (UUID or counter) for each request. Retries with the same key will not double-charge.
2. **Store the raw API key securely** at creation. It cannot be retrieved later.
3. **Handle the `renderer_unavailable` fallback.** The API returns 200 with full script/plan even when video rendering is temporarily unavailable.
4. **Monitor credit balance.** Check dashboard usage or catch `CREDITS_INSUFFICIENT` (402) to know when to top up.
5. **Rate limit:** 3 requests per 60 seconds per API key. Retry after the `Retry-After` header duration on 429 responses.
