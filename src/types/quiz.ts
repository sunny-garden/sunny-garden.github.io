export type AnswerChoice = 'yes' | 'no' | 'custom'

export interface AnswerValue {
  choice: AnswerChoice
  customText?: string
}

export type AnswerMap = Record<string, AnswerValue>

export interface Question {
  id: string
  eyebrow: string
  prompt: string
  tenderNote: string
  customPlaceholder: string
  maxLength: number
}

export interface QuizSubmission {
  timestamp: string
  answers: AnswerMap
  appVersion: string
  userAgent: string
}

export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'local-only' | 'error'

export interface SubmissionResult {
  status: Exclude<SubmissionStatus, 'idle' | 'submitting'>
  message: string
  remoteUpdatedAt?: string
}