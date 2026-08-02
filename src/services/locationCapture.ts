export const LETTER_LOCATION_STORAGE_KEY = 'letterLocation.lastSubmission.v1'
const LETTER_LOCATION_MOCK_ENDPOINT = '/api/mock/letter-location'

type LetterLocationStatus = 'granted' | 'denied' | 'unavailable' | 'error'

interface LetterLocationPayload {
  timestamp: string
  status: LetterLocationStatus
  userAgent: string
  latitude?: number
  longitude?: number
  accuracy?: number
  errorMessage?: string
}

interface SubmissionResult {
  status: 'mock-success' | 'remote-success' | 'remote-error'
  endpoint: string
  message?: string
}

const requestLocation = (): Promise<LetterLocationPayload> => {
  const basePayload = {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({
      ...basePayload,
      status: 'unavailable',
      errorMessage: 'Geolocation is not supported by this browser.',
    })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        ...basePayload,
        status: 'granted',
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      }),
      (error) => resolve({
        ...basePayload,
        status: error.code === 1 ? 'denied' : error.code === 2 ? 'unavailable' : 'error',
        errorMessage: error.message,
      }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    )
  })
}

const submitLetterLocation = async (
  payload: LetterLocationPayload,
): Promise<SubmissionResult> => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LETTER_LOCATION_STORAGE_KEY, JSON.stringify(payload))
  }

  const endpoint = import.meta.env.VITE_LETTER_LOCATION_API_URL?.trim()
  if (endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5_000),
      })

      if (!response.ok) {
        return {
          status: 'remote-error',
          endpoint,
          message: `Location API returned ${response.status}.`,
        }
      }

      return { status: 'remote-success', endpoint }
    } catch (error) {
      return {
        status: 'remote-error',
        endpoint,
        message: error instanceof Error ? error.message : 'Location API could not be reached.',
      }
    }
  }

  return {
    status: 'mock-success',
    endpoint: LETTER_LOCATION_MOCK_ENDPOINT,
  }
}

export const captureLetterLocation = async (): Promise<SubmissionResult> => {
  const payload = await requestLocation()
  return submitLetterLocation(payload)
}
