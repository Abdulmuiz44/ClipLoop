import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function write(rel, html) {
  const src = path.join(root, rel, 'index.html');
  const dst = path.join(root, 'dist', rel, 'index.html');
  fs.mkdirSync(path.dirname(src), { recursive: true });
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(src, html, 'utf8');
  fs.writeFileSync(dst, html, 'utf8');
  console.log('wrote', rel);
}

const shell = (title, body) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
<title>${title} · ClipLoop Developer Docs</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<a href="#content" class="skip-link">Skip to content</a>
<button class="mobile-toggle" aria-label="Open menu" onclick="document.getElementById('sidebar').classList.add('open');document.getElementById('overlay').classList.add('open')">☰</button>
<div class="sidebar-overlay" id="overlay" onclick="document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('open')"></div>
<nav class="sidebar" id="sidebar" aria-label="Docs navigation">
  <div class="logo">
    <div class="logo-mark">CL</div>
    <div class="logo-text">ClipLoop<small>Developer Docs</small></div>
  </div>
  <div class="nav-section">
    <div class="nav-section-title">Getting Started</div>
    <a href="/overview/" class="nav-link ">Overview</a>
    <a href="/quickstart/" class="nav-link ">Quickstart</a>
    <a href="/authentication/" class="nav-link ">Authentication</a>
    <a href="/idempotency/" class="nav-link ">Idempotency</a>
    <a href="/credits/" class="nav-link ">Credits & Billing</a>
  </div>
  <div class="nav-divider"></div>
  <div class="nav-section">
    <div class="nav-section-title">API Reference</div>
    <a href="/weekly-promo-api/" class="nav-link ">Weekly Promo API</a>
    <a href="/api-keys/" class="nav-link ">API Keys</a>
    <a href="/rate-limits/" class="nav-link ">Rate Limits</a>
    <a href="/video-jobs/" class="nav-link ">Video Jobs</a>
    <a href="/sdks/" class="nav-link ">SDKs</a>
    <a href="/cli/" class="nav-link ">CLI</a>
    <a href="/examples/" class="nav-link ">Examples</a>
    <a href="/errors/" class="nav-link ">Error Codes</a>
  </div>
  <div class="nav-divider"></div>
  <div class="nav-section">
    <div class="nav-section-title">More</div>
    <a href="/roadmap/" class="nav-link ">Roadmap</a>
    <a href="/changelog/" class="nav-link ">Changelog</a>
    <a href="https://app.cliploop.site" class="nav-link">App Dashboard →</a>
    <a href="https://cliploop.site" class="nav-link">Marketing Site →</a>
  </div>
</nav>
<main class="main" id="content">
  <div class="content">
    ${body}
    <footer>
      <p style="display:flex; flex-wrap:wrap; gap:14px; align-items:center; justify-content:space-between">
        <span>© 2026 ClipLoop · Built by <a href="https://talocode.com" style="color:var(--text3)">Talocode</a></span>
        <span style="display:flex; gap:14px">
          <a href="https://cliploop.site">Marketing</a>
          <a href="https://app.cliploop.site">Dashboard</a>
          <a href="https://github.com/talocode/cliploop">GitHub</a>
        </span>
      </p>
    </footer>
  </div>
</main>
<script>
document.getElementById('overlay').addEventListener('click', function(){
  document.getElementById('sidebar').classList.remove('open');
  this.classList.remove('open');
});
</script>
</body>
</html>
`;

write('api-keys', shell('API Keys', `<h1>API Keys</h1>
<p class="lead">ClipLoop API keys follow a simple creation, usage, and rotation model.</p>
<h2 id="creating-keys">Creating keys</h2>
<p>Create API keys in the dashboard: <a href="https://app.cliploop.site/dashboard/settings/api-keys">https://app.cliploop.site/dashboard/settings/api-keys</a>.</p>
<p>When creating a key, assign only the minimum scopes your use case needs. The Weekly Promo API requires the <code>weekly_promo:generate</code> scope.</p>
<h2 id="treating-keys-like-secrets">Treating keys like secrets</h2>
<p class="callout">ClipLoop shows each key once on creation. After that, you will only ever see its prefix in the dashboard again.</p>
<p>Revealing the full key value is intentionally disabled to limit leak blast radius. If you lose the full value, revoke the old key and create a new one.</p>
<h2 id="revocation">Revocation</h2>
<p>Revoke keys when they are no longer needed. A revoked key fails immediately, so rotate gracefully if downstream services depend on it.</p>
<h2 id="allowed-use">Allowed use</h2>
<p>Use API keys only from server-side code, backend jobs, CLIs, or secure workers. Never expose API keys in frontend apps, mobile bundles, public repositories, or client-side JavaScript.</p>
<h2 id="related">Related</h2>
<p><a href="/authentication/">Authentication</a> · <a href="/quickstart/">Quickstart</a> · <a href="/credits/">Credits & Billing</a></p>`));

write('rate-limits', shell('Rate Limits', `<h1>Rate Limits</h1>
<p class="lead">Rate limits protect rendering credits, queue capacity, and platform stability.</p>
<h2 id="current-model">Current model</h2>
<p>ClipLoop applies rate limits at the account and key scope level to prevent runaway usage, render bursts, and abuse. Safe usage patterns still work well for normal builders and automation workflows.</p>
<h2 id="429-behavior">429 behavior</h2>
<p>When you exceed a limit, the API returns <code>429 Too Many Requests</code>. Retry only after the indicated retry window, or use exponential backoff.</p>
<h2 id="safe-retries">Safe retries</h2>
<p>Combine retries with an <code>Idempotency-Key</code> so retries do not create duplicate generation requests. See <a href="/idempotency/">Idempotency</a> for the exact header format.</p>
<h2 id="avoiding-duplicates">Avoiding duplicates</h2>
<p>Do not fire multiple parallel requests for the same campaign or asset. Parallel duplicate generation can consume extra credits and queue slots without delivering additional value.</p>
<h2 id="best-practices">Best practices</h2>
<ul>
<li>Respect production endpoints as shared capacity.</li>
<li>Use backoff for recovery, not as a performance strategy.</li>
<li>Prefer caching and deduping over retry storms.</li>
</ul>
<h2 id="related">Related</h2>
<p><a href="/weekly-promo-api/">Weekly Promo API</a> · <a href="/idempotency/">Idempotency</a></p>`));

write('video-jobs', shell('Video Jobs', `<h1>Video Jobs</h1>
<p class="lead">Future video generation will use an async job model for longer renders and more control.</p>
<h2 id="what-is-changing">What is changing</h2>
<p>The first generation endpoint, Weekly Promo API, returns a completed artifact inline. Future generic video generation likely will use a job model because longer renders need status tracking, queuing, and download flexibility.</p>
<h2 id="job-flow">Job flow</h2>
<p>When generic video jobs ship, the expected flow will follow a standard create, poll, download pattern:</p>
<ul>
<li>POST create job</li>
<li>GET job status</li>
<li>GET download or artifact</li>
</ul>
<h2 id="job-statuses">Job statuses</h2>
<p>Planned status values:</p>
<ul>
<li><code>queued</code></li>
<li><code>processing</code></li>
<li><code>succeeded</code></li>
<li><code>failed</code></li>
<li><code>cancelled</code></li>
</ul>
<h2 id="why-jobs">Why jobs matter</h2>
<p>Longer render times need more than an inline response. Jobs make timeout handling, progress tracking, and retries safer for production workflows.</p>
<h2 id="webhooks">Webhooks</h2>
<p class="callout"><span style="color:var(--accent)">Planned</span> Webhook delivery for job completion is planned, but not live yet.</p>
<h2 id="related">Related</h2>
<p><a href="/weekly-promo-api/">Weekly Promo API</a> · <a href="/rate-limits/">Rate Limits</a> · <a href="/roadmap/">Roadmap</a></p>`));

write('sdks', shell('SDKs', `<h1>SDKs</h1>
<p class="lead">The official ClipLoop JavaScript/TypeScript SDK is live on npm.</p>
<h2 id="official-typescript-sdk">Official TypeScript SDK</h2>
<p><code>@cliploop/sdk</code> v0.1.0 is published on npm.</p>
<p><a href="https://www.npmjs.com/package/@cliploop/sdk">View on npm →</a></p>
<h2 id="installation">Installation</h2>
<pre><code>npm install @cliploop/sdk</code></pre>
<h2 id="usage">Usage</h2>
<p class="callout"><span style="color:var(--accent)">Server-side only</span> Use this SDK from Node.js, backend jobs, or secure workers. Do not call it from browser apps that ship to end users, and never expose <code>CLIPLOOP_API_KEY</code> in frontend code.</p>
<p>Set your API key in your environment:</p>
<pre><code>export CLIPLOOP_API_KEY="your-dashboard-api-key"</code></pre>
<p>Then call the client:</p>
<pre><code>import { ClipLoopClient } from "@cliploop/sdk";

const client = new ClipLoopClient({
  apiKey: process.env.CLIPLOOP_API_KEY
});

const result = await client.generateWeeklyPromo({
  appName: "ClipLoop",
  weeklyUpdate: "We shipped the first SDK foundation.",
  channel: "x",
  tone: "clear, sharp, builder focused",
  appWebsiteUrl: "https://cliploop.site",
  targetAudience: "indie app builders and SaaS founders",
  callToAction: "Try ClipLoop"
});

console.log(result.artifactId);</code></pre>
<h2 id="contract">Contract notes</h2>
<ul>
<li><code>channel</code> must be one of: <code>instagram</code>, <code>tiktok</code>, <code>whatsapp</code>, <code>x</code>.</li>
<li><code>tone</code> is required.</li>
<li><code>appWebsiteUrl</code> is optional. Omitted optional fields are not sent as <code>null</code>.</li>
<li>Idempotency is handled automatically unless you pass <code>idempotencyKey</code>.</li>
<li>The SDK calls <code>POST https://app.cliploop.site/api/public/weekly-promo</code>.</li>
</ul>
<h2 id="related">Related</h2>
<p><a href="/cli/">CLI</a> · <a href="/quickstart/">Quickstart</a> · <a href="/weekly-promo-api/">Weekly Promo API</a> · <a href="/api-keys/">API Keys</a></p>`));

write('cli', shell('CLI', `<h1>CLI</h1>
<p class="lead">A ClipLoop CLI is planned for terminals, scripts, and release workflows.</p>
<h2 id="planned-commands">Planned commands</h2>
<p class="callout"><span style="color:var(--accent)">Planned</span> The CLI is planned, but not live yet.</p>
<ul>
<li><code>cliploop login</code></li>
<li><code>cliploop generate</code></li>
<li><code>cliploop jobs</code></li>
<li><code>cliploop download</code></li>
</ul>
<h2 id="server-and-ci">Server and CI usage</h2>
<p>For automation, set <code>CLIPLOOP_API_KEY</code> in your environment instead of interactive login. This works for backend jobs, CI pipelines, and short release workflows.</p>
<h2 id="useful-for">Useful for</h2>
<ul>
<li>Indie builders iterating in terminals.</li>
<li>Release workflows that generate promos before deploy.</li>
<li>Automations that need simple, scripted API access.</li>
</ul>
<h2 id="related">Related</h2>
<p><a href="/weekly-promo-api/">Weekly Promo API</a> · <a href="/sdks/">SDKs</a> · <a href="/video-jobs/">Video Jobs</a></p>`));

write('changelog', shell('Changelog', `<h1>Changelog</h1>
<p class="lead">Key changes to the ClipLoop developer platform and API.</p>
<h2 id="recent-updates">Recent updates</h2>
<ul>
<li>Three-surface architecture available: cliploop.site, app.cliploop.site, and docs.cliploop.site.</li>
<li>Google authentication working.</li>
<li>API keys dashboard available at <a href="https://app.cliploop.site/dashboard/settings/api-keys">https://app.cliploop.site/dashboard/settings/api-keys</a>.</li>
<li>Public Weekly Promo API available.</li>
<li>Usage and credits dashboard available.</li>
<li>Billing page with credits view available at <a href="https://app.cliploop.site/dashboard/billing">https://app.cliploop.site/dashboard/billing</a>.</li>
<li>Multi-page developer docs shipped.</li>
<li>API platform direction documented.</li>
</ul>
<h2 id="stay-updated">Stay updated</h2>
<p>This changelog tracks high-level developer-facing changes. For request specifics, see <a href="/weekly-promo-api/">Weekly Promo API</a>.</p>
<h2 id="related">Related</h2>
<p><a href="/roadmap/">Roadmap</a> · <a href="/overview/">Overview</a></p>`));
