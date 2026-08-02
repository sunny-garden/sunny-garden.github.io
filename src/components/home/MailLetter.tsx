import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import letterClosedUrl from '../../../images/letter-closed.png'
import letterOpenedUrl from '../../../images/letter-opened.png'
import paperUrl from '../../../images/paper.png'

type MailStage = 'closed' | 'opened' | 'letter'

const MailLetter = () => {
  const [stage, setStage] = useState<MailStage>('closed')
  const reduceMotion = useReducedMotion()
  const openerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const openEnvelope = useCallback(() => {
    setStage((current) => (current === 'closed' ? 'opened' : current))
  }, [])

  const showLetter = useCallback(() => {
    setStage((current) => (current === 'opened' ? 'letter' : current))
  }, [])

  const closeLetter = useCallback(() => {
    setStage('opened')
    openerRef.current?.focus()
  }, [])

  const handleOpenedComplete = useCallback(() => {
    setStage((current) => (current === 'opened' ? 'letter' : current))
  }, [])

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
    width: clamp(82px, 24vw, 108px);
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
  filter: drop-shadow(0 10px 14px rgba(31, 47, 40, 0.3));
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
  box-shadow: 0 34px 90px rgba(10, 20, 24, 0.5);

  @media (max-width: 720px) {
    width: 100vw;
    height: 94svh;
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

  @media (max-width: 420px) {
    inset: 9% 15% 9%;
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
`

const CloseButton = styled.button`
  position: absolute;
  z-index: 3;
  top: max(10px, env(safe-area-inset-top));
  right: max(10px, env(safe-area-inset-right));
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  color: #ffffff;
  background: #111111;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 4px solid #b9233d;
    outline-offset: 3px;
  }
`

export default MailLetter
