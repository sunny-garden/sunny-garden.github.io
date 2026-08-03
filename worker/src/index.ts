const LOCATION_PATH = '/api/letter-location'
const MESSAGE_PATH = '/api/secret-message'
const MAX_BODY_BYTES = 8 * 1024
const MAX_TEXT_LENGTH = 512
const MAX_MESSAGE_LENGTH = 1000
const KNOWN_PATHS = new Set([LOCATION_PATH, MESSAGE_PATH])
const STATUSES = new Set(['granted', 'denied', 'unavailable', 'error'])
const PAYLOAD_FIELDS = new Set([
  'timestamp',
  'status',
  'userAgent',
  'latitude',
  'longitude',
  'accuracy',
  'errorMessage',
])

interface LocationPayload {
  timestamp: string
  status: 'granted' | 'denied' | 'unavailable' | 'error'
  userAgent: string
  latitude?: number
  longitude?: number
  accuracy?: number
  errorMessage?: string
}

interface MessagePayload {
  message: string
}

const json = (body: object, status: number, corsHeaders?: HeadersInit) => Response.json(body, {
  status,
  headers: corsHeaders,
})

const getCorsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const parseLocationPayload = (value: unknown): LocationPayload | null => {
  if (!isRecord(value) || Object.keys(value).some((field) => !PAYLOAD_FIELDS.has(field))) {
    return null
  }

  const { timestamp, status, userAgent, latitude, longitude, accuracy, errorMessage } = value
  if (
    typeof timestamp !== 'string'
    || Number.isNaN(Date.parse(timestamp))
    || new Date(timestamp).toISOString() !== timestamp
    || typeof status !== 'string'
    || !STATUSES.has(status)
    || typeof userAgent !== 'string'
    || userAgent.length > MAX_TEXT_LENGTH
    || (errorMessage !== undefined
      && (typeof errorMessage !== 'string' || errorMessage.length > MAX_TEXT_LENGTH))
  ) {
    return null
  }

  if (status === 'granted') {
    if (
      !isFiniteNumber(latitude)
      || latitude < -90
      || latitude > 90
      || !isFiniteNumber(longitude)
      || longitude < -180
      || longitude > 180
      || !isFiniteNumber(accuracy)
      || accuracy < 0
    ) {
      return null
    }
  } else if (latitude !== undefined || longitude !== undefined || accuracy !== undefined) {
    return null
  }

  return {
    timestamp,
    status: status as LocationPayload['status'],
    userAgent,
    ...(status === 'granted' ? { latitude, longitude, accuracy } : {}),
    ...(errorMessage === undefined ? {} : { errorMessage }),
  }
}

const parseMessagePayload = (value: unknown): MessagePayload | null => {
  if (!isRecord(value) || Object.keys(value).some((field) => field !== 'message')) {
    return null
  }

  const { message } = value
  if (typeof message !== 'string') {
    return null
  }

  const trimmed = message.trim()
  if (trimmed.length < 1 || trimmed.length > MAX_MESSAGE_LENGTH) {
    return null
  }

  return { message: trimmed }
}

const readBoundedBody = async (request: Request): Promise<string | null> => {
  const contentLength = Number(request.headers.get('Content-Length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return null
  }

  if (!request.body) {
    return ''
  }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let bytesRead = 0
  let body = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    bytesRead += value.byteLength
    if (bytesRead > MAX_BODY_BYTES) {
      await reader.cancel()
      return null
    }
    body += decoder.decode(value, { stream: true })
  }

  return body + decoder.decode()
}

const guardCors = (request: Request, env: Env): { corsHeaders: HeadersInit } | Response => {
  const origin = request.headers.get('Origin')
  if (origin !== env.ALLOWED_ORIGIN) {
    return json({ error: 'Forbidden' }, 403)
  }

  const corsHeaders = getCorsHeaders(origin)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
    })
  }
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    return json({ error: 'Invalid request' }, 400, corsHeaders)
  }

  return { corsHeaders }
}

const handleLocation = async (request: Request, env: Env, corsHeaders: HeadersInit): Promise<Response> => {
  const body = await readBoundedBody(request)
  if (body === null) return json({ error: 'Invalid request' }, 400, corsHeaders)

  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return json({ error: 'Invalid request' }, 400, corsHeaders)
  }

  const payload = parseLocationPayload(parsed)
  if (!payload) {
    return json({ error: 'Invalid request' }, 400, corsHeaders)
  }

  const id = crypto.randomUUID()
  const serverTimestamp = new Date().toISOString()
  try {
    await env.LOCATIONS.prepare(`
      INSERT INTO letter_locations (
        id, client_timestamp, server_timestamp, status,
        latitude, longitude, accuracy, error_message, user_agent
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    `).bind(
      id,
      payload.timestamp,
      serverTimestamp,
      payload.status,
      payload.latitude ?? null,
      payload.longitude ?? null,
      payload.accuracy ?? null,
      payload.errorMessage ?? null,
      payload.userAgent,
    ).run()

    return json({ ok: true, id }, 201, corsHeaders)
  } catch (error) {
    console.error(JSON.stringify({
      message: 'D1 location insert failed',
      error: error instanceof Error ? error.message : String(error),
    }))
    return json({ error: 'Internal server error' }, 500, corsHeaders)
  }
}

const handleMessage = async (request: Request, env: Env, corsHeaders: HeadersInit): Promise<Response> => {
  const body = await readBoundedBody(request)
  if (body === null) return json({ error: 'Invalid request' }, 400, corsHeaders)

  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return json({ error: 'Invalid request' }, 400, corsHeaders)
  }

  const payload = parseMessagePayload(parsed)
  if (!payload) {
    return json({ error: 'Invalid request' }, 400, corsHeaders)
  }

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  try {
    await env.LOCATIONS.prepare(`
      INSERT INTO secret_messages (id, message, created_at)
      VALUES (?1, ?2, ?3)
    `).bind(id, payload.message, createdAt).run()

    return json({ ok: true, id }, 201, corsHeaders)
  } catch (error) {
    console.error(JSON.stringify({
      message: 'D1 secret message insert failed',
      error: error instanceof Error ? error.message : String(error),
    }))
    return json({ error: 'Internal server error' }, 500, corsHeaders)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (!KNOWN_PATHS.has(pathname)) {
      return json({ error: 'Not found' }, 404)
    }

    const guardResult = guardCors(request, env)
    if (guardResult instanceof Response) {
      return guardResult
    }

    const { corsHeaders } = guardResult
    if (pathname === LOCATION_PATH) {
      return handleLocation(request, env, corsHeaders)
    }
    return handleMessage(request, env, corsHeaders)
  },
} satisfies ExportedHandler<Env>
