import { describe, expect, it, vi } from 'vitest'
import worker from './index'

const ORIGIN = 'https://sunny-garden.github.io'
const ENDPOINT = 'https://letter-api.example.com/api/letter-location'

interface FakeDatabase {
  bindingValues: unknown[]
  prepare: ReturnType<typeof vi.fn>
}

const createDatabase = (failure?: Error): FakeDatabase => {
  const database: FakeDatabase = {
    bindingValues: [],
    prepare: vi.fn(),
  }
  database.prepare.mockImplementation(() => ({
    bind: (...values: unknown[]) => {
      database.bindingValues = values
      return {
        run: async () => {
          if (failure) throw failure
          return { success: true }
        },
      }
    },
  }))
  return database
}

const callWorker = (request: Request, database = createDatabase()) => ({
  database,
  response: worker.fetch(request, {
    ALLOWED_ORIGIN: ORIGIN,
    LOCATIONS: database,
  } as never),
})

const validPayload = {
  timestamp: '2026-08-02T12:00:00.000Z',
  status: 'granted',
  userAgent: 'Test Browser',
  latitude: 51.5,
  longitude: -0.12,
  accuracy: 18,
}

const post = (payload: unknown, origin = ORIGIN) => new Request(ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Origin: origin,
  },
  body: JSON.stringify(payload),
})

describe('letter location Worker', () => {
  it('accepts a preflight from the configured origin', async () => {
    const { response } = callWorker(new Request(ENDPOINT, {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN },
    }))

    const result = await response

    expect(result.status).toBe(204)
    expect(result.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
    expect(result.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
  })

  it('rejects requests from other origins', async () => {
    const { response } = callWorker(post(validPayload, 'https://attacker.example'))

    expect((await response).status).toBe(403)
  })

  it('rejects unknown routes', async () => {
    const request = new Request('https://letter-api.example.com/private', {
      headers: { Origin: ORIGIN },
    })

    expect((await callWorker(request).response).status).toBe(404)
  })

  it('rejects inconsistent granted payloads', async () => {
    const missingLatitude = { ...validPayload, latitude: undefined }

    expect((await callWorker(post(missingLatitude)).response).status).toBe(400)
  })

  it('rejects unknown payload fields', async () => {
    expect((await callWorker(post({ ...validPayload, visitorName: 'secret' })).response).status)
      .toBe(400)
  })

  it('cancels a headerless request stream after the body limit', async () => {
    let pulls = 0
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1
        controller.enqueue(new Uint8Array(1024))
        if (pulls === 20) controller.close()
      },
      cancel() {
        cancelled = true
      },
    })
    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' })

    const result = await callWorker(request).response

    expect(result.status).toBe(400)
    expect(cancelled).toBe(true)
    expect(pulls).toBeLessThan(20)
  })

  it('inserts a valid payload using bound parameters', async () => {
    const { database, response } = callWorker(post(validPayload))

    const result = await response
    const body = await result.json() as { ok: boolean; id: string }

    expect(result.status).toBe(201)
    expect(body.ok).toBe(true)
    expect(body.id).toEqual(expect.any(String))
    expect(database.prepare).toHaveBeenCalledOnce()
    expect(database.bindingValues).toHaveLength(9)
    expect(database.bindingValues.slice(1)).toEqual([
      validPayload.timestamp,
      expect.any(String),
      'granted',
      51.5,
      -0.12,
      18,
      null,
      'Test Browser',
    ])
  })

  it('returns a generic response when D1 fails', async () => {
    const database = createDatabase(new Error('private SQL detail'))
    const result = await callWorker(post(validPayload), database).response

    expect(result.status).toBe(500)
    expect(await result.text()).not.toContain('private SQL detail')
  })
})
