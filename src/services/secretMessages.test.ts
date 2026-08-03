import { afterEach, describe, expect, it, vi } from 'vitest'
import { submitSecretMessage } from './secretMessages'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('submitSecretMessage', () => {
  it('rejects empty messages', async () => {
    const result = await submitSecretMessage('')
    expect(result).toMatchObject({ status: 'error' })
  })

  it('rejects whitespace-only messages', async () => {
    const result = await submitSecretMessage('   \n  ')
    expect(result).toMatchObject({ status: 'error' })
  })

  it('rejects messages over 1000 characters', async () => {
    const result = await submitSecretMessage('a'.repeat(1001))
    expect(result).toMatchObject({ status: 'error' })
  })

  it('returns error when no endpoint is configured', async () => {
    vi.stubEnv('VITE_SECRET_MESSAGE_API_URL', '')
    const result = await submitSecretMessage('hello')
    expect(result).toMatchObject({ status: 'error' })
  })

  it('posts a valid message and returns success', async () => {
    const endpoint = 'https://api.example.com/api/secret-message'
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ ok: true, id: 'msg-123' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    ))
    vi.stubEnv('VITE_SECRET_MESSAGE_API_URL', endpoint)
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitSecretMessage('  hello world  ')

    expect(result).toEqual({ status: 'success', id: 'msg-123' })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(endpoint)
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(JSON.parse(init.body as string)).toEqual({ message: 'hello world' })
  })

  it('returns error for non-2xx responses', async () => {
    const endpoint = 'https://api.example.com/api/secret-message'
    vi.stubEnv('VITE_SECRET_MESSAGE_API_URL', endpoint)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: 'Bad request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )))

    const result = await submitSecretMessage('hello')
    expect(result).toMatchObject({ status: 'error' })
  })

  it('returns error for network failures', async () => {
    const endpoint = 'https://api.example.com/api/secret-message'
    vi.stubEnv('VITE_SECRET_MESSAGE_API_URL', endpoint)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const result = await submitSecretMessage('hello')
    expect(result).toMatchObject({ status: 'error' })
  })

  it('does not persist the message locally', async () => {
    const setItemMock = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: setItemMock,
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    })
    const endpoint = 'https://api.example.com/api/secret-message'
    vi.stubEnv('VITE_SECRET_MESSAGE_API_URL', endpoint)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await submitSecretMessage('secret note')
    expect(setItemMock).not.toHaveBeenCalled()
  })
})
