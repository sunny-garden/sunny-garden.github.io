import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { questions } from '../data/questions'
import { getAnswerLabel } from '../hooks/useQuiz'
import { submitQuizSubmission } from '../services/jsonbin'
import { playUiSound } from '../services/soundEffects'
import type {
  AnswerMap,
  QuizSubmission,
  SubmissionResult,
  SubmissionStatus,
} from '../types/quiz'
import CatFace from './CatFace'
import FloatingPaws from './FloatingPaws'

interface ResultsScreenProps {
  answers: AnswerMap
  onReset: () => void
}

const ResultsScreen = ({ answers, onReset }: ResultsScreenProps) => {
  const submittedRef = useRef(false)
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle')
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const submissionPayload = useMemo<QuizSubmission>(
    () => ({
      timestamp: new Date().toISOString(),
      answers,
      appVersion: '2.0.0',
      userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
    }),
    [answers],
  )

  useEffect(() => {
    if (submittedRef.current) {
      return undefined
    }

    let isMounted = true
    submittedRef.current = true
    setSubmissionStatus('submitting')

    submitQuizSubmission(submissionPayload).then((result) => {
      if (!isMounted) {
        return
      }

      setSubmissionResult(result)
      setSubmissionStatus(result.status)
    })

    return () => {
      isMounted = false
    }
  }, [submissionPayload])

  useEffect(() => {
    if (submissionStatus === 'success' || submissionStatus === 'local-only') {
      playUiSound('save')
    }
  }, [submissionStatus])

  const statusCopy = (() => {
    if (submissionStatus === 'submitting') {
      return 'Saving your answers...'
    }

    if (submissionResult) {
      return submissionResult.message
    }

    return 'Your answers are ready.'
  })()

  const handleReset = () => {
    playUiSound('transition')
    onReset()
  }

  return (
    <ResultsStage>
      <FloatingPaws density="lush" />
      <ResultsWrap
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <ClosingCard>
          <CatBadge>
            <CatFace size="lg" label="Gray cat face" />
          </CatBadge>
          <ResultsKicker>All tucked in</ResultsKicker>
          <h1>Your answers are saved.</h1>
          <p>
            The summary below keeps the quiz simple: every response is YES, NO, or Custom Answer,
            with your custom words preserved exactly where you wrote them.
          </p>
          <CatDivider aria-hidden="true">
            <span />
            <CatFace size="sm" />
            <span />
          </CatDivider>
          <SubmissionPill data-status={submissionStatus} aria-live="polite">
            <StatusCat data-loading={submissionStatus === 'submitting'}>
              <CatFace size="sm" />
            </StatusCat>
            {statusCopy}
          </SubmissionPill>
        </ClosingCard>

        <SummaryCard>
          <SummaryHeader>
            <p>Your answers</p>
            <h2>Blue-white snapshot</h2>
          </SummaryHeader>
          <AnswerGrid>
            {questions.map((question, index) => (
              <AnswerTile key={question.id}>
                <TileTop>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <CatFace size="sm" />
                </TileTop>
                <h3>{question.eyebrow}</h3>
                <p>{getAnswerLabel(answers[question.id])}</p>
              </AnswerTile>
            ))}
          </AnswerGrid>
        </SummaryCard>

        <ResetButton type="button" onClick={handleReset} whileTap={{ scale: 0.96 }}>
          Start again
        </ResetButton>
      </ResultsWrap>
    </ResultsStage>
  )
}

const ResultsStage = styled.main`
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  padding: max(24px, env(safe-area-inset-top)) 16px max(36px, env(safe-area-inset-bottom));
`

const ResultsWrap = styled(motion.div)`
  position: relative;
  z-index: 1;
  display: grid;
  gap: 22px;
  width: min(100%, 940px);
  margin: 0 auto;
`

const ClosingCard = styled.section`
  display: grid;
  justify-items: center;
  gap: 16px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 44px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(234, 246, 255, 0.84)),
    var(--surface-strong);
  box-shadow: var(--shadow-soft);
  text-align: center;
  backdrop-filter: blur(22px);

  h1 {
    max-width: 12ch;
    margin: 0;
    color: var(--ink-strong);
    font-family: var(--serif);
    font-size: 4.35rem;
    line-height: 1;
    letter-spacing: 0;
  }

  p {
    max-width: 58ch;
    margin: 0;
    color: var(--ink-soft);
    font-size: 1.04rem;
    line-height: 1.66;
    letter-spacing: 0;
  }

  @media (max-width: 720px) {
    padding: 34px 22px;

    h1 {
      font-size: 3.2rem;
    }
  }

  @media (max-width: 460px) {
    h1 {
      font-size: 2.35rem;
    }
  }
`

const CatBadge = styled.div`
  display: grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border: 1px solid rgba(83, 145, 199, 0.26);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow:
    inset 0 0 0 10px rgba(234, 246, 255, 0.74),
    0 20px 42px rgba(7, 60, 116, 0.12);
`

const ResultsKicker = styled.span`
  color: var(--blue-strong);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.17em;
  text-transform: uppercase;
`

const CatDivider = styled.div`
  display: grid;
  grid-template-columns: minmax(44px, 1fr) auto minmax(44px, 1fr);
  gap: 10px;
  align-items: center;
  width: min(100%, 280px);

  span {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(83, 145, 199, 0.42), transparent);
  }
`

const SubmissionPill = styled.div`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(83, 145, 199, 0.32);
  border-radius: 999px;
  padding: 9px 16px;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.72);
  font-size: 0.94rem;
  font-weight: 850;
  line-height: 1.3;
  letter-spacing: 0;

  &[data-status='success'],
  &[data-status='local-only'] {
    color: var(--blue-deep);
    background: rgba(234, 246, 255, 0.92);
  }

  &[data-status='error'] {
    color: var(--ink-strong);
    border-color: rgba(7, 60, 116, 0.44);
  }
`

const StatusCat = styled.span`
  display: inline-grid;
  place-items: center;

  &[data-loading='true'] {
    animation: cat-breathe 900ms ease-in-out infinite alternate;
  }

  @keyframes cat-breathe {
    from {
      transform: translateY(0) scale(0.96);
    }

    to {
      transform: translateY(-1px) scale(1.03);
    }
  }
`

const SummaryCard = styled.section`
  display: grid;
  gap: 18px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 34px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 22px 60px rgba(7, 60, 116, 0.12);
  backdrop-filter: blur(18px);

  @media (max-width: 560px) {
    padding: 24px 18px;
  }
`

const SummaryHeader = styled.header`
  display: grid;
  gap: 6px;
  text-align: center;

  p {
    margin: 0;
    color: var(--blue-strong);
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0.17em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    color: var(--ink-strong);
    font-family: var(--serif);
    font-size: 3.25rem;
    line-height: 1;
    letter-spacing: 0;
  }

  @media (max-width: 720px) {
    h2 {
      font-size: 2.55rem;
    }
  }

  @media (max-width: 460px) {
    h2 {
      font-size: 2rem;
    }
  }
`

const AnswerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

const AnswerTile = styled.article`
  display: grid;
  gap: 8px;
  border: 1px solid rgba(83, 145, 199, 0.28);
  border-radius: 8px;
  padding: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(234, 246, 255, 0.68)),
    rgba(255, 255, 255, 0.84);

  h3 {
    margin: 0;
    color: var(--ink-strong);
    font-size: 1.05rem;
    line-height: 1.25;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: var(--ink-soft);
    line-height: 1.46;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
`

const TileTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  > span {
    color: var(--blue-strong);
    font-size: 0.78rem;
    font-weight: 900;
    letter-spacing: 0.14em;
  }
`

const ResetButton = styled(motion.button)`
  justify-self: center;
  min-height: 52px;
  border: 1px solid rgba(83, 145, 199, 0.38);
  border-radius: 999px;
  padding: 14px 22px;
  color: var(--blue-deep);
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 14px 34px rgba(7, 60, 116, 0.1);
  font: inherit;
  font-weight: 850;
  letter-spacing: 0;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;

  &:focus-visible {
    outline: 3px solid rgba(11, 104, 189, 0.42);
    outline-offset: 4px;
  }

  @media (max-width: 420px) {
    min-height: 48px;
    padding: 12px 18px;
  }
`

export default ResultsScreen