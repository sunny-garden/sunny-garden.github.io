import { AnimatePresence, motion } from 'framer-motion'
import styled from 'styled-components'
import { playUiSound } from '../services/soundEffects'
import type { AnswerValue, Question } from '../types/quiz'
import AnswerOptions from './AnswerOptions'
import CatFace from './CatFace'

interface QuestionCardProps {
  answer: AnswerValue | undefined
  canContinue: boolean
  currentIndex: number
  direction: number
  progressPercent: number
  question: Question
  questionCount: number
  onAnswer: (questionId: string, value: AnswerValue) => void
  onBack: () => void
  onNext: () => void
}

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 64 : -64,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -64 : 64,
    opacity: 0,
    scale: 0.96,
  }),
}

const QuestionCard = ({
  answer,
  canContinue,
  currentIndex,
  direction,
  progressPercent,
  question,
  questionCount,
  onAnswer,
  onBack,
  onNext,
}: QuestionCardProps) => {
  const isFinalQuestion = currentIndex === questionCount - 1

  const handleBack = () => {
    playUiSound('click')
    onBack()
  }

  const handleNext = () => {
    playUiSound(isFinalQuestion ? 'complete' : 'transition')
    onNext()
  }

  return (
    <QuizStage>
      <ProgressHeader aria-label={`Question ${currentIndex + 1} of ${questionCount}`}>
        <ProgressMeta>
          <span>{String(currentIndex + 1).padStart(2, '0')}</span>
          <span>{String(questionCount).padStart(2, '0')}</span>
        </ProgressMeta>
        <ProgressTrack>
          <ProgressFill
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 130, damping: 22 }}
          />
          <ProgressCat
            animate={{ left: `${Math.min(progressPercent, 98)}%` }}
            transition={{ type: 'spring', stiffness: 130, damping: 22 }}
          >
            <CatFace size="sm" />
          </ProgressCat>
        </ProgressTrack>
      </ProgressHeader>

      <AnimatePresence mode="wait" custom={direction}>
        <Card
          key={question.id}
          custom={direction}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 145, damping: 20, mass: 0.9 }}
        >
          <CornerCat size="md" />
          <QuestionHeader>
            <HeaderIcon>
              <CatFace size="lg" />
            </HeaderIcon>
            <Eyebrow>{question.eyebrow}</Eyebrow>
            <Prompt
              key={`${question.id}-prompt`}
              initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.35 }}
              animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
              transition={{ duration: Math.min(1.35, question.prompt.length * 0.01), ease: 'linear' }}
            >
              {question.prompt}
            </Prompt>
            <CatDivider aria-hidden="true">
              <span />
              <CatFace size="sm" />
              <span />
            </CatDivider>
            <TenderNote>{question.tenderNote}</TenderNote>
          </QuestionHeader>

          <InputArea>
            <AnswerOptions
              question={question}
              value={answer}
              onChange={(value) => onAnswer(question.id, value)}
            />
          </InputArea>

          <NavRow>
            <GhostButton
              type="button"
              onClick={handleBack}
              disabled={currentIndex === 0}
              whileTap={{ scale: 0.96 }}
            >
              Back
            </GhostButton>
            <NextButton
              type="button"
              onClick={handleNext}
              disabled={!canContinue}
              whileHover={canContinue ? { y: -2 } : undefined}
              whileTap={canContinue ? { scale: 0.96 } : undefined}
            >
              {isFinalQuestion ? 'See summary' : 'Next'}
            </NextButton>
          </NavRow>
        </Card>
      </AnimatePresence>
    </QuizStage>
  )
}

const QuizStage = styled.main`
  display: grid;
  grid-template-rows: auto 1fr;
  align-items: center;
  min-height: 100dvh;
  width: min(100%, 840px);
  margin: 0 auto;
  padding: max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom));
`

const ProgressHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: grid;
  gap: 8px;
  width: 100%;
  padding: 8px 2px 18px;
`

const ProgressMeta = styled.div`
  display: flex;
  justify-content: space-between;
  color: var(--ink-muted);
  font-size: 0.86rem;
  font-weight: 900;
  letter-spacing: 0.08em;
`

const ProgressTrack = styled.div`
  position: relative;
  height: 14px;
  border: 1px solid rgba(83, 145, 199, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.64),
    0 12px 28px rgba(7, 60, 116, 0.1);
  overflow: visible;
`

const ProgressFill = styled(motion.div)`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--blue-bright), var(--blue-deep));
  box-shadow: 0 0 22px rgba(31, 143, 229, 0.38);
`

const ProgressCat = styled(motion.span)`
  position: absolute;
  top: 50%;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  transform: translate(-50%, -50%);
`

const Card = styled(motion.section)`
  position: relative;
  display: grid;
  gap: 30px;
  width: 100%;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 42px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(234, 246, 255, 0.84)),
    var(--surface-strong);
  box-shadow:
    var(--shadow-soft),
    inset 0 0 0 1px rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(22px);
  overflow: hidden;

  @media (max-width: 640px) {
    gap: 24px;
    padding: 28px 20px;
  }
`

const CornerCat = styled(CatFace)`
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0.34;
`

const QuestionHeader = styled.header`
  display: grid;
  justify-items: center;
  gap: 12px;
  text-align: center;
`

const HeaderIcon = styled.div`
  display: grid;
  place-items: center;
  width: 86px;
  height: 86px;
  border: 1px solid rgba(83, 145, 199, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 8px rgba(234, 246, 255, 0.72);
`

const Eyebrow = styled.p`
  margin: 0;
  color: var(--blue-strong);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.17em;
  text-transform: uppercase;
`

const Prompt = styled(motion.h1)`
  min-height: 2.45em;
  margin: 0;
  color: var(--ink-strong);
  font-family: var(--serif);
  font-size: 3.35rem;
  font-weight: 760;
  line-height: 1.02;
  letter-spacing: 0;

  @media (max-width: 720px) {
    font-size: 2.65rem;
  }

  @media (max-width: 460px) {
    font-size: 2rem;
  }
`

const CatDivider = styled.div`
  display: grid;
  grid-template-columns: minmax(48px, 1fr) auto minmax(48px, 1fr);
  gap: 10px;
  align-items: center;
  width: min(100%, 300px);

  span {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(83, 145, 199, 0.42), transparent);
  }
`

const TenderNote = styled.p`
  max-width: 60ch;
  margin: 0;
  color: var(--ink-soft);
  font-size: 1.04rem;
  line-height: 1.62;
  letter-spacing: 0;
`

const InputArea = styled.div`
  min-height: 252px;
  display: grid;
  align-items: center;
`

const NavRow = styled.div`
  display: grid;
  grid-template-columns: minmax(96px, auto) 1fr;
  gap: 12px;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`

const GhostButton = styled(motion.button)`
  min-height: 52px;
  border: 1px solid rgba(83, 145, 199, 0.38);
  border-radius: 999px;
  padding: 14px 18px;
  color: var(--blue-deep);
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 12px 28px rgba(7, 60, 116, 0.08);
  font: inherit;
  font-weight: 850;
  letter-spacing: 0;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.44;
  }

  &:focus-visible {
    outline: 3px solid rgba(11, 104, 189, 0.42);
    outline-offset: 4px;
  }

  @media (max-width: 420px) {
    min-height: 48px;
    padding: 12px 16px;
  }
`

const NextButton = styled(motion.button)`
  min-height: 52px;
  border: 0;
  border-radius: 999px;
  padding: 14px 22px;
  color: white;
  background: linear-gradient(135deg, var(--blue-bright), var(--blue-deep));
  box-shadow: 0 18px 42px rgba(7, 60, 116, 0.24);
  font: inherit;
  font-weight: 900;
  letter-spacing: 0;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.46;
    box-shadow: none;
  }

  &:focus-visible {
    outline: 3px solid rgba(11, 104, 189, 0.42);
    outline-offset: 4px;
  }

  @media (max-width: 420px) {
    min-height: 48px;
    padding: 12px 18px;
  }
`

export default QuestionCard