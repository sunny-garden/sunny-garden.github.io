import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import styled, { css, keyframes } from 'styled-components'
import { playUiSound } from '../services/soundEffects'

/** Hardcoded passcode — case-insensitive. */
const PASSWORD = 'toji'
const HINT_TEXT = 'Four letters. No cursed energy. Infinite trouble.'

interface PasswordGateProps {
  /** Called when the correct password is submitted. */
  onUnlock: () => void
}

/**
 * A dark frosted-glass passcode gate. Plays a success chime on correct input
 * or a error buzz + shake animation on wrong input.
 */
const PasswordGate = ({ onUnlock }: PasswordGateProps) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (value.trim().toLowerCase() === PASSWORD) {
        playUiSound('complete')
        onUnlock()
      } else {
        playUiSound('error')
        setError(true)
        setValue('')
      }
    },
    [value, onUnlock],
  )

  return (
    <GateWrap
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <GateCard
        $errored={error}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <GateTitle>{HINT_TEXT}</GateTitle>

        <form onSubmit={handleSubmit} autoComplete="off">
          <GateInput
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(false)
            }}
            placeholder="passcode"
            autoFocus
            aria-label="Passcode"
            $errored={error}
          />
          <GateButton
            type="submit"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Enter
          </GateButton>
        </form>

        {error && <GateError>Wrong passcode. Try again.</GateError>}
      </GateCard>
    </GateWrap>
  )
}

export default PasswordGate

/* ── Styled components ─────────────────────────────────────────────────────── */

const shakeKeyframe = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
`

const GateWrap = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 24px 20px;
`

const GateCard = styled(motion.div)<{ $errored: boolean }>`
  width: 100%;
  max-width: min(360px, 90vw);
  padding: clamp(24px, 6vw, 36px) clamp(18px, 5vw, 28px);
  border-radius: 20px;
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid
    ${({ $errored }) =>
      $errored ? 'rgba(239, 68, 68, 0.55)' : 'rgba(214, 233, 250, 0.18)'};
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(10px, 3vw, 14px);
  animation: ${({ $errored }) =>
    $errored ? css`0.4s ${shakeKeyframe}` : 'none'};
`

const GateTitle = styled.h1`
  margin: 0;
  font-family: 'Archivo Black', sans-serif;
  font-weight: 400;
  font-size: clamp(1.1rem, 5vw, 1.5rem);
  letter-spacing: 0.04em;
  text-align: center;
  color: #cfe4ff;
  text-shadow: 0 2px 12px rgba(59, 130, 246, 0.5);
  line-height: 1.3;
`

const GateInput = styled.input<{ $errored: boolean }>`
  width: 100%;
  margin-top: 6px;
  padding: clamp(12px, 3vw, 14px) clamp(12px, 3vw, 16px);
  border-radius: 12px;
  border: 1px solid
    ${({ $errored }) =>
      $errored ? 'rgba(239, 68, 68, 0.6)' : 'rgba(214, 233, 250, 0.25)'};
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: clamp(0.95rem, 3.5vw, 1.1rem);
  letter-spacing: 0.12em;
  text-align: center;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 0.04em;
  }

  &:focus {
    border-color: rgba(59, 130, 246, 0.75);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  }
`

const GateButton = styled(motion.button)`
  width: 100%;
  margin-top: 12px;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1px solid rgba(214, 233, 250, 0.4);
  background: #1f7ae0;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(31, 122, 224, 0.4);
`

const GateError = styled.p`
  margin: 4px 0 0;
  font-size: 0.82rem;
  text-align: center;
  color: #ef4444;
  font-weight: 600;
`
