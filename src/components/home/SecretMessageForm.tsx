import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styled from 'styled-components'
import paperUrl from '../../../images/paper.png'
import { submitSecretMessage } from '../../services/secretMessages'

type FormStage = 'editing' | 'submitting' | 'error' | 'sent'

interface SecretMessageFormProps {
  onBack: () => void
  onSent: () => void
}

const MAX_LENGTH = 1000

const SecretMessageForm = ({ onBack, onSent }: SecretMessageFormProps) => {
  const [message, setMessage] = useState('')
  const [stage, setStage] = useState<FormStage>('editing')
  const reduceMotion = useReducedMotion()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const remaining = MAX_LENGTH - message.length
  const overLimit = remaining < 0
  const canSend = message.trim().length > 0 && !overLimit

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSend = useCallback(async () => {
    if (!canSend || stage === 'submitting') return

    setStage('submitting')
    const result = await submitSecretMessage(message)

    if (result.status === 'success') {
      setStage('sent')
      onSent()
    } else {
      setStage('error')
    }
  }, [message, canSend, stage, onSent])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void handleSend()
    }
  }, [handleSend])

  useEffect(() => {
    if (stage === 'error') {
      const timer = setTimeout(() => setStage('editing'), 2500)
      return () => clearTimeout(timer)
    }
  }, [stage])

  if (stage === 'sent') {
    return (
      <FormPaper
        role="dialog"
        aria-modal="true"
        aria-label="Message sent"
        initial={reduceMotion ? false : { opacity: 0, y: '72%', scale: 0.58, rotate: -4 }}
        animate={{ opacity: 1, y: '0%', scale: 1, rotate: 0 }}
        exit={
          reduceMotion
            ? undefined
            : { opacity: 0, y: '72%', scale: 0.62, rotate: -3, transition: { duration: 0.24, ease: 'easeIn' } }
        }
        transition={
          reduceMotion
            ? { duration: 0.01 }
            : { type: 'spring', stiffness: 120, damping: 20, mass: 1.05 }
        }
      >
        <PaperBg src={paperUrl} alt="" width="1024" height="1024" draggable={false} />
        <SentContent
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0.01 } : { duration: 0.55, ease: 'easeOut', delay: 0.12 }}
        >
          <SentTitle>Message Sent</SentTitle>
          <SentBody>
            <p>Your secret message has been delivered.</p>
            <p>Thank you for sharing a piece of your heart.</p>
          </SentBody>
        </SentContent>
      </FormPaper>
    )
  }

  return (
    <FormPaper
      role="dialog"
      aria-modal="true"
      aria-label="Write a secret message"
      initial={reduceMotion ? false : { opacity: 0, y: '72%', scale: 0.58, rotate: -4 }}
      animate={{ opacity: 1, y: '0%', scale: 1, rotate: 0 }}
      exit={
        reduceMotion
          ? undefined
          : { opacity: 0, y: '72%', scale: 0.62, rotate: -3, transition: { duration: 0.24, ease: 'easeIn' } }
      }
      transition={
        reduceMotion
          ? { duration: 0.01 }
          : { type: 'spring', stiffness: 120, damping: 20, mass: 1.05 }
      }
    >
      <PaperBg src={paperUrl} alt="" width="1024" height="1024" draggable={false} />
      <FormContent>
        <FormTitle>Secret Message</FormTitle>
        <TextareaWrapper>
          <MessageTextarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your secret message here..."
            maxLength={MAX_LENGTH + 200}
            disabled={stage === 'submitting'}
            aria-label="Your secret message"
            aria-describedby="char-count"
            $overLimit={overLimit}
          />
          <CharCount id="char-count" role="status" aria-live="polite" $overLimit={overLimit}>
            {remaining} / {MAX_LENGTH}
          </CharCount>
        </TextareaWrapper>

        {stage === 'error' && (
          <ErrorMessage role="alert">
            Could not send your message. Please try again.
          </ErrorMessage>
        )}

        <ButtonRow>
          <BackButton type="button" onClick={onBack} disabled={stage === 'submitting'}>
            Back
          </BackButton>
          <SendButton
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend || stage === 'submitting'}
          >
            {stage === 'submitting' ? 'Sending...' : 'Send'}
          </SendButton>
        </ButtonRow>
      </FormContent>
    </FormPaper>
  )
}

const FormPaper = styled(motion.div)`
  position: relative;
  z-index: 1;
  width: min(90vw, 620px);
  height: min(84svh, 780px);
  overflow: hidden;
  border-radius: 14px;

  @media (max-width: 720px) {
    width: min(145vw, 680px);
    height: min(96svh, 900px);
    border-radius: 0;
  }
`

const PaperBg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;

  @media (max-width: 720px) {
    transform: scaleX(1.16);
    transform-origin: center;
  }
`

const FormContent = styled.div`
  position: absolute;
  inset: 9% 16% 9%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 clamp(2px, 1vw, 8px) 12px;
  font-family: var(--serif);
  color: #20140a;

  @media (max-width: 720px) {
    inset: 9.5% 15.5% 11%;
  }

  @media (max-width: 420px) {
    inset: 10% 17% 12%;
  }
`

const FormTitle = styled.h2`
  margin: 0 0 0.55em;
  font-size: clamp(1.2rem, 4.3vw, 1.8rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #3d2408;
`

const TextareaWrapper = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
`

const MessageTextarea = styled.textarea<{ $overLimit: boolean }>`
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 10px;
  border: 1px solid ${({ $overLimit }) => ($overLimit ? '#b9233d' : 'rgba(61, 36, 8, 0.22)')};
  border-radius: 6px;
  background: rgba(255, 253, 244, 0.62);
  color: #20140a;
  font-family: var(--serif);
  font-size: clamp(0.9rem, 3.3vw, 1.08rem);
  line-height: 1.52;
  resize: none;
  outline: none;
  transition: border-color 0.18s;

  &:focus {
    border-color: ${({ $overLimit }) => ($overLimit ? '#b9233d' : '#3d2408')};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 420px) {
    font-size: 16px;
    padding: 8px;
    line-height: 1.38;
  }
`

const CharCount = styled.div<{ $overLimit: boolean }>`
  margin-top: 4px;
  font-size: clamp(0.68rem, 2.2vw, 0.78rem);
  text-align: right;
  color: ${({ $overLimit }) => ($overLimit ? '#b9233d' : 'rgba(61, 36, 8, 0.55)')};
  font-family: var(--sans);
`

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
  width: 100%;
`

const SendButton = styled.button`
  flex: 1.5;
  min-height: 44px;
  padding: 8px 16px;
  border: 0;
  border-radius: 999px;
  background: #3d2408;
  color: #fff7db;
  font-family: var(--serif);
  font-size: clamp(0.82rem, 2.6vw, 0.96rem);
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.18s, opacity 0.18s;

  &:hover:not(:disabled) {
    background: #5a3a18;
  }

  &:active:not(:disabled) {
    background: #2a1806;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 4px solid #b9233d;
    outline-offset: 3px;
  }
`

const BackButton = styled.button`
  flex: 1;
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid rgba(61, 36, 8, 0.3);
  border-radius: 999px;
  background: transparent;
  color: #3d2408;
  font-family: var(--serif);
  font-size: clamp(0.82rem, 2.6vw, 0.96rem);
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.18s, opacity 0.18s;

  &:hover:not(:disabled) {
    background: rgba(61, 36, 8, 0.08);
  }

  &:active:not(:disabled) {
    background: rgba(61, 36, 8, 0.14);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 4px solid #b9233d;
    outline-offset: 3px;
  }
`

const ErrorMessage = styled.div`
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(185, 35, 61, 0.1);
  color: #8a1a2c;
  font-family: var(--sans);
  font-size: clamp(0.74rem, 2.4vw, 0.84rem);
  text-align: center;
`

const SentContent = styled(motion.div)`
  position: absolute;
  inset: 9% 16% 9%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(2px, 1vw, 8px) 12px;
  font-family: var(--serif);
  color: #20140a;
  text-align: center;

  @media (max-width: 720px) {
    inset: 9.5% 15.5% 11%;
  }

  @media (max-width: 420px) {
    inset: 10% 17% 12%;
  }
`

const SentTitle = styled.h2`
  margin: 0 0 0.55em;
  font-size: clamp(1.2rem, 4.3vw, 1.8rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #3d2408;
`

const SentBody = styled.div`
  p {
    margin: 0 0 1em;
    font-size: clamp(0.9rem, 3.3vw, 1.08rem);
    line-height: 1.52;
  }
`

export default SecretMessageForm
