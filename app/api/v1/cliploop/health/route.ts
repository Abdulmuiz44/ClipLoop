export async function GET(): Promise<Response> {
  return Response.json({
    status: 'ok',
    service: 'cliploop',
    endpoints: [
      'POST /v1/cliploop/brief/generate',
      'POST /v1/cliploop/script/generate',
      'POST /v1/cliploop/video/render',
      'POST /v1/cliploop/campaign/create',
      'POST /v1/cliploop/campaign/package',
      'GET /v1/cliploop/health',
    ],
  })
}
