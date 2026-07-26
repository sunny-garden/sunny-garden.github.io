import type { QuizSubmission, SubmissionResult } from '../types/quiz'

const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b'
const LOCAL_SUBMISSION_KEY = 'catQuiz.lastSubmission.v1'

interface JsonBinEnvelope {
  record?: unknown
  metadata?: {
    updatedAt?: string
  }
}

interface SubmissionCollection {
  submissions: QuizSubmission[]
  updatedAt: string
}

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const saveLocalCopy = (submission: QuizSubmission) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LOCAL_SUBMISSION_KEY, JSON.stringify(submission))
}

const createCollection = (record: unknown, submission: QuizSubmission): SubmissionCollection => {
  const existingSubmissions = isRecordObject(record) && Array.isArray(record.submissions)
    ? record.submissions.filter((item): item is QuizSubmission => isRecordObject(item))
    : []

  return {
    ...(isRecordObject(record) ? record : {}),
    submissions: [...existingSubmissions, submission],
    updatedAt: submission.timestamp,
  }
}

export const submitQuizSubmission = async (
  submission: QuizSubmission,
): Promise<SubmissionResult> => {
  const apiKey = import.meta.env.REACT_APP_JSONBIN_API_KEY
  const binId = import.meta.env.REACT_APP_JSONBIN_BIN_ID

  saveLocalCopy(submission)

  if (!apiKey || !binId) {
    return {
      status: 'local-only',
      message:
        'Your answers are saved on this device. JSONBin is not configured, so nothing was sent online.',
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': apiKey,
    'X-Bin-Versioning': 'false',
  }

  try {
    const currentResponse = await fetch(`${JSONBIN_BASE_URL}/${binId}/latest`, {
      headers,
    })

    if (!currentResponse.ok && currentResponse.status !== 404) {
      throw new Error(`JSONBin read failed with ${currentResponse.status}`)
    }

    const currentEnvelope = currentResponse.ok
      ? ((await currentResponse.json()) as JsonBinEnvelope)
      : undefined
    const nextRecord = createCollection(currentEnvelope?.record, submission)

    const updateResponse = await fetch(`${JSONBIN_BASE_URL}/${binId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(nextRecord),
    })

    if (!updateResponse.ok) {
      throw new Error(`JSONBin update failed with ${updateResponse.status}`)
    }

    const updateEnvelope = (await updateResponse.json()) as JsonBinEnvelope

    return {
      status: 'success',
      message: 'Your answers were saved.',
      remoteUpdatedAt: updateEnvelope.metadata?.updatedAt,
    }
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error
          ? `Your answers stayed saved on this device, but JSONBin could not be reached: ${error.message}`
          : 'Your answers stayed saved on this device, but JSONBin could not be reached.',
    }
  }
}