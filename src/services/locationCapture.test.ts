import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  LETTER_LOCATION_STORAGE_KEY,
  captureLetterLocation,
} from './locationCapture'

const storage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
} satisfies Storage

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('captureLetterLocation', () => {
  it('saves granted coordinates through the local mock endpoint', async () => {
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('navigator', {
      userAgent: 'Test Browser',
      geolocation: {
        getCurrentPosition: (success: PositionCallback) => success({
          coords: {
            latitude: 51.5,
            longitude: -0.12,
            accuracy: 18,
          },
        } as GeolocationPosition),
      },
    })

    const result = await captureLetterLocation()

    expect(result.status).toBe('mock-success')
    expect(result.endpoint).toBe('/api/mock/letter-location')
    expect(storage.setItem).toHaveBeenCalledOnce()
    expect(storage.setItem).toHaveBeenCalledWith(
      LETTER_LOCATION_STORAGE_KEY,
      expect.any(String),
    )

    const payload = JSON.parse(storage.setItem.mock.calls[0][1])
    expect(payload).toMatchObject({
      status: 'granted',
      latitude: 51.5,
      longitude: -0.12,
      accuracy: 18,
      userAgent: 'Test Browser',
    })
    expect(payload.timestamp).toEqual(expect.any(String))
  })

  it('saves a denied attempt without rejecting', async () => {
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('navigator', {
      userAgent: 'Test Browser',
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
          error({ code: 1, message: 'Permission denied' } as GeolocationPositionError),
      },
    })

    const result = await captureLetterLocation()

    expect(result.status).toBe('mock-success')
    const payload = JSON.parse(storage.setItem.mock.calls[0][1])
    expect(payload).toMatchObject({
      status: 'denied',
      errorMessage: 'Permission denied',
      userAgent: 'Test Browser',
    })
  })

  it('records an unavailable position distinctly from other errors', async () => {
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('navigator', {
      userAgent: 'Test Browser',
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
          error({ code: 2, message: 'Position unavailable' } as GeolocationPositionError),
      },
    })

    await captureLetterLocation()

    const payload = JSON.parse(storage.setItem.mock.calls[0][1])
    expect(payload).toMatchObject({
      status: 'unavailable',
      errorMessage: 'Position unavailable',
    })
  })

  it('posts the locally saved payload to the configured API', async () => {
    const endpoint = 'https://location-api.example.com/api/letter-location'
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ ok: true, id: 'submission-id' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    ))
    vi.stubEnv('VITE_LETTER_LOCATION_API_URL', endpoint)
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('navigator', {
      userAgent: 'Test Browser',
      geolocation: {
        getCurrentPosition: (success: PositionCallback) => success({
          coords: { latitude: 51.5, longitude: -0.12, accuracy: 18 },
        } as GeolocationPosition),
      },
    })

    const result = await captureLetterLocation()

    expect(result).toMatchObject({ status: 'remote-success', endpoint })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(endpoint)
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(init.body as string)).toMatchObject({
      status: 'granted',
      latitude: 51.5,
      longitude: -0.12,
    })
    expect(storage.setItem).toHaveBeenCalledBefore(fetchMock)
  })

  it('keeps the local payload when the configured API cannot be reached', async () => {
    const endpoint = 'https://location-api.example.com/api/letter-location'
    vi.stubEnv('VITE_LETTER_LOCATION_API_URL', endpoint)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('navigator', {
      userAgent: 'Test Browser',
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
          error({ code: 1, message: 'Permission denied' } as GeolocationPositionError),
      },
    })

    const result = await captureLetterLocation()

    expect(result).toMatchObject({ status: 'remote-error', endpoint })
    expect(storage.setItem).toHaveBeenCalledOnce()
  })
})
