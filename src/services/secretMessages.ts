type SecretMessageResult =
  | { status: 'success'; id: string }
  | { status: 'error'; message: string }

const MESSAGE_FIELD = 'message'

const sanitizeMessage = (raw: string): string | null => {
  const trimmed = raw.trim()
  if (trimmed.length < 1 || trimmed.length > 1000) {
    return null
  }
  return trimmed
}

export const submitSecretMessage = async (
  message: string,
): Promise<SecretMessageResult> => {
  const sanitized = sanitizeMessage(message)
  if (!sanitized) {
    return { status: 'error', message: 'Your message is empty or too long.' }
  }

  const endpoint = import.meta.env.VITE_SECRET_MESSAGE_API_URL?.trim()
  if (!endpoint) {
    return { status: 'error', message: 'Message sending is not configured.' }
  }

  const payload: Record<string, string> = {}
  payload[MESSAGE_FIELD] = sanitized

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return {
        status: 'error',
        message: 'Could not send your message right now. Please try again.',
      }
    }

    const data = await response.json() as { ok: boolean; id: string }
    if (data.ok === true && typeof data.id === 'string') {
      return { status: 'success', id: data.id }
    }

    return { status: 'error', message: 'Could not send your message right now. Please try again.' }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { status: 'error', message: 'The request timed out. Please try again.' }
    }
    return { status: 'error', message: 'Could not send your message right now. Please try again.' }
  }
}
