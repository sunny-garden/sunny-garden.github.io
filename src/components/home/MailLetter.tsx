import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import letterClosedUrl from '../../../images/letter-closed.png'
import letterOpenedUrl from '../../../images/letter-opened.png'
import paperUrl from '../../../images/paper.png'
import { captureLetterLocation } from '../../services/locationCapture'
import { playUiSound } from '../../services/soundEffects'

type MailStage = 'closed' | 'opened' | 'letter'

const MailLetter = () => {
  const [stage, setStage] = useState<MailStage>('closed')
  const reduceMotion = useReducedMotion()
  const openerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const locationRequestRef = useRef<Promise<unknown> | null>(null)
  const revealPendingRef = useRef(false)

  const openEnvelope = useCallback(() => {
    playUiSound('select')
    setStage((current) => (current === 'closed' ? 'opened' : current))
  }, [])

  const showLetter = useCallback(async () => {
    if (revealPendingRef.current) {
      return
    }

    revealPendingRef.current = true
    playUiSound('transition')
    try {
      locationRequestRef.current ??= captureLetterLocation().catch(() => undefined)
      await locationRequestRef.current
      setStage((current) => (current === 'opened' ? 'letter' : current))
    } finally {
      revealPendingRef.current = false
    }
  }, [])

  const closeLetter = useCallback(() => {
    playUiSound('click')
    setStage('opened')
    openerRef.current?.focus()
  }, [])

  const handleOpenedComplete = useCallback(() => {
    void showLetter()
  }, [showLetter])

  useEffect(() => {
    if (stage !== 'letter') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLetter()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [stage, closeLetter])

  useEffect(() => {
    if (stage === 'letter') {
      closeButtonRef.current?.focus()
    }
  }, [stage])

  const letterOpen = stage === 'letter'

  return (
    <>
      <MailGroup
        initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.7 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0.01 } : { type: 'spring', stiffness: 150, damping: 17, delay: 0.5 }}
      >
        <MailFloat>
          <MailButton
            ref={openerRef}
            type="button"
            aria-label="Open the letter"
            aria-haspopup="dialog"
            aria-expanded={letterOpen}
            onClick={stage === 'closed' ? openEnvelope : showLetter}
            whileHover={reduceMotion ? undefined : { scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { scale: 0.93 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {stage === 'closed' ? (
                <EnvelopeImage
                  key="closed"
                  src={letterClosedUrl}
                  alt=""
                  width="1024"
                  height="1024"
                  draggable={false}
                  exit={
                    reduceMotion
                      ? undefined
                      : { scale: 1.16, opacity: 0, rotate: -9, transition: { duration: 0.22, ease: 'easeIn' } }
                  }
                />
              ) : (
                <EnvelopeImage
                  key="opened"
                  src={letterOpenedUrl}
                  alt=""
                  width="1024"
                  height="1024"
                  draggable={false}
                  initial={reduceMotion ? false : { scale: 0.7, opacity: 0, rotate: 14, y: 8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                  exit={reduceMotion ? undefined : { scale: 0.94, opacity: 0.35, transition: { duration: 0.18 } }}
                  transition={
                    reduceMotion
                      ? { duration: 0.01 }
                      : { type: 'spring', stiffness: 300, damping: 18, mass: 0.9 }
                  }
                  onAnimationComplete={handleOpenedComplete}
                />
              )}
            </AnimatePresence>
          </MailButton>
        </MailFloat>
      </MailGroup>

      <AnimatePresence>
        {letterOpen && (
          <LetterLayer key="letter-layer">
            <Scrim type="button" aria-label="Close the letter" onClick={closeLetter} />
            <PaperCard
              role="dialog"
              aria-modal="true"
              aria-label="An open letter for you"
              initial={reduceMotion ? false : { opacity: 0, y: '72%', scale: 0.58, rotate: -4 }}
              animate={{ opacity: 1, y: '0%', scale: 1, rotate: 0 }}
              exit={
                reduceMotion
                  ? undefined
                  : {
                      opacity: 0,
                      y: '72%',
                      scale: 0.62,
                      rotate: -3,
                      transition: { duration: 0.24, ease: 'easeIn' },
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : { type: 'spring', stiffness: 120, damping: 20, mass: 1.05 }
              }
            >
              <PaperImage src={paperUrl} alt="" width="1024" height="1024" draggable={false} />
              <PaperText
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? { duration: 0.01 } : { duration: 0.55, ease: 'easeOut', delay: 0.22 }}
              >
                <PaperTitle>For You</PaperTitle>
                <PaperBody>
                  <p>My dearest,</p>
                  <p>
                    Some days the sun seems to forget where it left us, and then you walk in
                    and everything remembers how to bloom again. This little garden of ours
                    grows a little wilder and a little brighter with every laugh we share.
                  </p>
                  <p>
                    I wanted to send you a letter the old-fashioned way — wax seal, cursive,
                    a stamp that smells like summer. But honestly, I just wanted an excuse to
                    write your name a few extra times today.
                  </p>
                  <p>
                    Keep this paper for a while, or fold it into a paper plane and let it fly
                    across the room. Wherever it lands, I hope it lands near a smile.
                  </p>
                  <p>
                    Yours, always — the one who keeps forgetting where they left the
                    watering can.
                  </p>
                </PaperBody>
              </PaperText>
              <CloseButton
                ref={closeButtonRef}
                type="button"
                aria-label="Close the letter"
                onClick={closeLetter}
              >
                ✕
              </CloseButton>
            </PaperCard>
          </LetterLayer>
        )}
      </AnimatePresence>
    </>
  )
}

const mailFloat = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -5px, 0); }
`

const MailGroup = styled(motion.div)`
  position: absolute;
  z-index: 5;
  left: 62%;
  bottom: max(9vh, calc(env(safe-area-inset-bottom) + 44px));
  width: clamp(76px, 10vw, 112px);
  translate: -50% 0;
  transform-origin: 50% 100%;

  @media (max-width: 720px) {
    left: 64%;
    bottom: max(10vh, calc(env(safe-area-inset-bottom) + 42px));
    width: clamp(118px, 32vw, 150px);
  }
`

const MailFloat = styled.div`
  animation: ${mailFloat} 3.6s ease-in-out infinite;
  will-change: transform;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const MailButton = styled(motion.button)`
  display: block;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 18px;
  background: transparent;
  cursor: pointer;
  transform-origin: 50% 85%;
  filter: none;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 4px solid #b9233d;
    outline-offset: 4px;
  }
`

const EnvelopeImage = styled(motion.img)`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
`

const LetterLayer = styled.div`
  position: fixed;
  z-index: 50;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  pointer-events: auto;
`

const Scrim = styled.button`
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: transparent;
  outline: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`

const PaperCard = styled(motion.div)`
  position: relative;
  z-index: 1;
  width: min(90vw, 620px);
  height: min(84svh, 780px);
  overflow: hidden;
  border-radius: 14px;
  box-shadow: none;

  @media (max-width: 720px) {
    width: min(145vw, 680px);
    height: min(96svh, 900px);
    border-radius: 0;
  }
`

const PaperImage = styled.img`
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

const PaperText = styled(motion.div)`
  position: absolute;
  inset: 9% 16% 9%;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 clamp(2px, 1vw, 8px) 12px;
  text-align: center;
  font-family: var(--serif);
  color: #20140a;

  @media (max-width: 720px) {
    inset: 9.5% 15.5% 11%;
  }

  @media (max-width: 420px) {
    inset: 10% 17% 12%;
  }
`

const PaperTitle = styled.h2`
  margin: 0 0 0.55em;
  font-size: clamp(1.2rem, 4.3vw, 1.8rem);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #3d2408;
`

const PaperBody = styled.div`
  p {
    margin: 0 0 1em;
    font-size: clamp(0.9rem, 3.3vw, 1.08rem);
    line-height: 1.52;
    text-align: left;
    max-width: 34em;
  }

  p:first-child {
    text-align: center;
  }

  p:last-child {
    text-align: right;
  }

  @media (max-width: 420px) {
    p {
      margin-bottom: 0.76em;
      font-size: clamp(0.78rem, 3.15vw, 0.92rem);
      line-height: 1.38;
    }
  }
`

const CloseButton = styled.button`
  position: fixed;
  z-index: 3;
  top: max(12px, calc(env(safe-area-inset-top) + 8px));
  right: max(12px, calc(env(safe-area-inset-right) + 8px));
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  color: #ffffff;
  background: #111111;
  box-shadow: none;
  font-size: 0.68rem;
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 4px solid #b9233d;
    outline-offset: 3px;
  }
`

export default MailLetter
