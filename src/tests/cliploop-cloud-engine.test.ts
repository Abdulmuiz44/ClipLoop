import test from 'node:test'
import assert from 'node:assert/strict'
import {
  generateBrief,
  generateScript,
  renderVideo,
  createCampaign,
  packageCampaign,
  briefInputSchema,
  scriptInputSchema,
  renderInputSchema,
  campaignCreateInputSchema,
  campaignPackageInputSchema,
} from '@/lib/cliploop-cloud-engine'

const ORIGINAL_ENV = { ...process.env }

test.afterEach(() => {
  Object.assign(process.env, ORIGINAL_ENV)
})

test.after(() => {
  Object.assign(process.env, ORIGINAL_ENV)
})

const mockContext = {
  requestId: 'test_req_1',
  keyType: 'talocode' as const,
  action: 'brief.generate',
  credits: 15,
  mode: 'hosted' as const,
  idempotencyKey: 'idem_test_1',
}

// ─── Schema Validation ───────────────────────────────────────────────────

test('briefInputSchema: rejects empty productName', () => {
  const result = briefInputSchema.safeParse({ productName: '', update: 'test' })
  assert.equal(result.success, false)
})

test('briefInputSchema: accepts valid input', () => {
  const result = briefInputSchema.safeParse({ productName: 'Test', update: 'We shipped X' })
  assert.equal(result.success, true)
})

test('scriptInputSchema: rejects missing briefId', () => {
  const result = scriptInputSchema.safeParse({})
  assert.equal(result.success, false)
})

test('scriptInputSchema: accepts valid input', () => {
  const result = scriptInputSchema.safeParse({ briefId: 'brief_123' })
  assert.equal(result.success, true)
})

test('renderInputSchema: accepts valid input', () => {
  const result = renderInputSchema.safeParse({ scriptId: 'script_123' })
  assert.equal(result.success, true)
})

test('campaignCreateInputSchema: rejects missing name', () => {
  const result = campaignCreateInputSchema.safeParse({ platform: 'tiktok' })
  assert.equal(result.success, false)
})

test('campaignCreateInputSchema: rejects missing platform', () => {
  const result = campaignCreateInputSchema.safeParse({ name: 'Test' })
  assert.equal(result.success, false)
})

test('campaignPackageInputSchema: rejects missing campaignId', () => {
  const result = campaignPackageInputSchema.safeParse({})
  assert.equal(result.success, false)
})

// ─── Engine: deterministic fallback (mock mode) ─────────────────────────

test('generateBrief: returns deterministic result in mock mode', async () => {
  process.env.MOCK_LLM = 'true'
  process.env.LLM_PROVIDER = 'mock'
  const result = await generateBrief(
    { productName: 'TestApp', update: 'Launched new API', audience: 'developers', platform: 'x' },
    mockContext,
  )
  assert.ok(result.title)
  assert.ok(result.angle)
  assert.ok(result.hook)
  assert.ok(Array.isArray(result.keyPoints))
  assert.ok(result.keyPoints.length >= 1)
  assert.ok(result.cta)
})

test('generateScript: returns deterministic result with scenes', async () => {
  process.env.MOCK_LLM = 'true'
  const result = await generateScript({ briefId: 'brief_123', style: 'storytelling' }, {
    ...mockContext, action: 'script.generate', credits: 15,
  })
  assert.ok(result.hook)
  assert.ok(result.script)
  assert.ok(Array.isArray(result.scenes))
  assert.ok(result.scenes.length >= 1)
  assert.ok(result.caption)
  assert.ok(Array.isArray(result.hashtags))
})

test('renderVideo: returns provider_required when not configured', async () => {
  process.env.REMOTION_RENDER_ENABLED = 'false'
  process.env.MOCK_LLM = 'false'
  const result = await renderVideo({ scriptId: 'script_123', format: 'portrait' }, {
    ...mockContext, action: 'video.render', credits: 200,
  })
  assert.equal(result.status, 'provider_required')
  assert.ok(result.message?.includes('render provider'))
})

test('renderVideo: returns queued when configured', async () => {
  process.env.REMOTION_RENDER_ENABLED = 'true'
  const result = await renderVideo({ scriptId: 'script_123' }, {
    ...mockContext, action: 'video.render', credits: 200,
  })
  assert.equal(result.status, 'queued')
  assert.ok(result.estimatedSeconds)
})

test('renderVideo: returns queued in mock mode', async () => {
  process.env.MOCK_LLM = 'true'
  process.env.REMOTION_RENDER_ENABLED = 'false'
  const result = await renderVideo({ scriptId: 'script_123' }, {
    ...mockContext, action: 'video.render', credits: 200,
  })
  assert.equal(result.status, 'queued')
})

test('createCampaign: returns campaign object', async () => {
  const result = await createCampaign({ name: 'Q3 Launch', platform: 'tiktok', schedule: '2026-07-15' }, {
    ...mockContext, action: 'campaign.create', credits: 50,
  })
  assert.ok(result.campaignId)
  assert.equal(result.name, 'Q3 Launch')
  assert.equal(result.platform, 'tiktok')
  assert.equal(result.schedule, '2026-07-15')
  assert.equal(result.status, 'draft')
  assert.ok(Array.isArray(result.scripts))
})

test('packageCampaign: returns package object', async () => {
  const result = await packageCampaign({ campaignId: 'campaign_123' }, {
    ...mockContext, action: 'campaign.package', credits: 400,
  })
  assert.ok(result.packageId)
  assert.equal(result.campaignId, 'campaign_123')
  assert.equal(result.status, 'packaged')
  assert.ok(Array.isArray(result.files))
  assert.ok(result.summary)
})

// ─── Engine: not called when auth/billing fails (handled by route handler) ─

test('engine exports are functions', () => {
  assert.equal(typeof generateBrief, 'function')
  assert.equal(typeof generateScript, 'function')
  assert.equal(typeof renderVideo, 'function')
  assert.equal(typeof createCampaign, 'function')
  assert.equal(typeof packageCampaign, 'function')
})
