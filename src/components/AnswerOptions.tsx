import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { playUiSound } from '../services/soundEffects'
import type { AnswerChoice, AnswerValue, Question } from '../types/quiz'
import CatFace from './CatFace'

interface AnswerOptionsProps {
  question: Question
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
}

interface BurstParticle {
  id: string
  x: number
  y: number
  rotate: number
  size: number
}

const choices: Array<{ id: AnswerChoice; label: string }> = [
  { id: 'yes', label: 'YES' },
  { id: 'no', label: 'NO' },
  { id: 'custom', label: 'Custom Answer' },
]

const AnswerOptions = ({ question, value, onChange }: AnswerOptionsProps) => {
  const [particles, setParticles] = useState<BurstParticle[]>([])
  const customText = value?.choice === 'custom' ? value.customText ?? '' : ''
  const remainingCharacters = question.maxLength - customText.length

  useEffect(() => {
    if (particles.length === 0) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setParticles([]), 680)
    return () => window.clearTimeout(timeoutId)
  }, [particles])

  const triggerBurst = (choice: AnswerChoice) => {
    setParticles(
      Array.from({ length: 7 }, (_, index) => ({
        id: `${choice}-${Date.now()}-${index}`,
        x: Math.round((Math.random() - 0.5) * 140),
        y: Math.round(-48 - Math.random() * 72),
        rotate: Math.round((Math.random() - 0.5) * 80),
        size: Math.round(15 + Math.random() * 8),
      })),
    )
  }

  const selectChoice = (choice: AnswerChoice) => {
    playUiSound('select')
    triggerBurst(choice)

    if (choice === 'custom') {
      onChange({ choice, customText })
      return
    }

    onChange({ choice })
  }

  return (
    <AnswerWrap>
      <BurstStage aria-hidden="true">
        {particles.map((particle) => (
          <BurstPaw
            key={particle.id}
            $size={particle.size}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0.45, 1, 0.7],
              x: particle.x,
              y: particle.y,
              rotate: particle.rotate,
            }}
            transition={{ duration: 0.64, ease: 'easeOut' }}
          >
            <span className="toe toe-one" />
            <span className="toe toe-two" />
            <span className="toe toe-three" />
            <span className="pad" />
          </BurstPaw>
        ))}
      </BurstStage>

      <ChoiceGrid role="group" aria-label={question.prompt}>
        {choices.map((choice) => {
          const isSelected = value?.choice === choice.id

          return (
            <OptionButton
              key={choice.id}
              type="button"
              aria-pressed={isSelected}
              data-selected={isSelected}
              onClick={() => selectChoice(choice.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <OptionCat size="sm" />
              <span>{choice.label}</span>
            </OptionButton>
          )
        })}
      </ChoiceGrid>

      {value?.choice === 'custom' && (
        <CustomPanel
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        >
          <CustomTextarea
            value={customText}
            maxLength={question.maxLength}
            placeholder={question.customPlaceholder}
            aria-label="Custom Answer"
            onChange={(event) => onChange({ choice: 'custom', customText: event.currentTarget.value })}
            whileFocus={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          />
          <Counter data-low={remainingCharacters < 50}>
            {remainingCharacters} characters left
          </Counter>
        </CustomPanel>
      )}
    </AnswerWrap>
  )
}

const AnswerWrap = styled.div`
  position: relative;
  display: grid;
  gap: 16px;
  width: 100%;
`

const BurstStage = styled.div`
  position: absolute;
  inset: auto 50% 58% auto;
  z-index: 3;
  width: 1px;
  height: 1px;
  pointer-events: none;
`

const BurstPaw = styled(motion.span)<{ $size: number }>`
  position: absolute;
  display: block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;

  .toe,
  .pad {
    position: absolute;
    display: block;
    background: rgba(79, 89, 101, 0.46);
  }

  .toe {
    width: 22%;
    height: 24%;
    border-radius: 999px;
  }

  .toe-one {
    top: 16%;
    left: 20%;
    transform: rotate(-20deg);
  }

  .toe-two {
    top: 6%;
    left: 42%;
  }

  .toe-three {
    top: 16%;
    right: 20%;
    transform: rotate(20deg);
  }

  .pad {
    left: 24%;
    bottom: 12%;
    width: 52%;
    height: 43%;
    border-radius: 48% 48% 54% 54%;
  }
`

const ChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const OptionButton = styled(motion.button)`
  position: relative;
  display: grid;
  min-height: 88px;
  align-items: center;
  justify-items: center;
  gap: 8px;
  width: 100%;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 16px 12px;
  color: var(--blue-deep);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(234, 246, 255, 0.86)),
    var(--white);
  box-shadow: var(--shadow-tight);
  font: inherit;
  font-size: 1.02rem;
  font-weight: 900;
  line-height: 1.18;
  text-align: center;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    color 180ms ease;

  @media (max-width: 420px) {
    min-height: 72px;
    padding: 14px 10px;
    font-size: 0.94rem;
  }

  &[data-selected='true'] {
    border-color: rgba(11, 104, 189, 0.86);
    color: #ffffff;
    background:
      linear-gradient(180deg, rgba(31, 143, 229, 0.98), rgba(7, 60, 116, 0.96)),
      var(--blue-strong);
    box-shadow:
      0 20px 46px rgba(7, 60, 116, 0.24),
      0 0 0 5px rgba(207, 232, 251, 0.72);
  }

  &:focus-visible {
    outline: 3px solid rgba(11, 104, 189, 0.42);
    outline-offset: 3px;
  }
`

const OptionCat = styled(CatFace)`
  opacity: 0.86;

  ${OptionButton}[data-selected='true'] & {
    opacity: 1;
    filter: grayscale(1) brightness(1.08);
  }
`

const CustomPanel = styled(motion.div)`
  display: grid;
  gap: 10px;
`

const CustomTextarea = styled(motion.textarea)`
  width: 100%;
  min-height: 168px;
  resize: vertical;
  border: 1px solid rgba(83, 145, 199, 0.42);
  border-radius: 8px;
  padding: 18px 20px;
  color: var(--ink-strong);
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.44),
    0 18px 44px rgba(7, 60, 116, 0.12);
  font: inherit;
  font-size: 1.02rem;
  line-height: 1.55;
  letter-spacing: 0;
  outline: none;

  &::placeholder {
    color: rgba(23, 75, 122, 0.58);
  }

  &:focus-visible {
    border-color: rgba(11, 104, 189, 0.86);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.44),
      0 18px 44px rgba(7, 60, 116, 0.12),
      0 0 0 5px rgba(207, 232, 251, 0.82);
  }
`

const Counter = styled.span`
  justify-self: end;
  color: var(--ink-muted);
  font-size: 0.9rem;
  line-height: 1.2;
  letter-spacing: 0;

  &[data-low='true'] {
    color: var(--blue-deep);
    font-weight: 850;
  }
`

export default AnswerOptions