import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import FloatingFaces from '../components/FloatingFaces'
import PasswordGate from '../components/PasswordGate'
import { notifyVisit } from '../services/notification'
import { playUiSound } from '../services/soundEffects'

const zoomBreathe = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
`

const floatIn = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`

const heartGlow = keyframes`
  0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.55)); }
  50%      { transform: scale(1.12); filter: drop-shadow(0 0 24px rgba(59, 130, 246, 0.95)); }
`

const TAGLINE_TEXT =
  'Hang in there Sunny! It will take some time but I Promise I\'m gonna try my best to reach out to you when I\'m available :)'

const TAGLINE_WORDS = TAGLINE_TEXT.split(' ')

/** Per-word stagger; words reveal sequentially with a gentle blur-in. */
const wordVariants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.35 + i * 0.11, duration: 0.55, ease: 'easeOut' as const },
  }),
}

/** Subtle hover wiggle applied to every word after it has revealed. */
const wordWiggle = {
  hover: {
    y: [0, -3, 0],
    color: ['#cfe4ff', '#9fd0ff', '#cfe4ff'],
    transition: { duration: 0.6, ease: 'easeInOut' as const },
  },
}

interface LyricRevealProps {
  text: string
}

/**
 * Word-by-word "lyrical" reveal. Each word is an inline span wrapped with a
 * regular space so the browser lays the text out naturally (no flex-collapse).
 * Words stagger in with a blur-in, then gain a gentle hover wiggle.
 */
const LyricReveal = ({ text }: LyricRevealProps) => {
  const words = text.split(' ')
  return (
    <Tagline>
      {words.map((word, i) => (
        <WordSpan key={`w-${i}`} custom={i} variants={wordVariants} initial="hidden" animate="visible">
          <motion.span whileHover="hover" variants={wordWiggle} style={{ display: 'inline-block' }}>
            {word}
          </motion.span>
          {i < words.length - 1 ? '\u00A0' : ''}
        </WordSpan>
      ))}
    </Tagline>
  )
}

/**
 * Meme-style home page with the dancing cat GIF and background music.
 *
 * Flow:
 *  1. A "Heyy!" button is shown first (so the music can start on a user
 *     gesture, satisfying browser autoplay rules).
 *  2. After pressing it, the music begins and the floating faces, dancing cat
 *     GIF, the lyrical tagline and a closing "I Love You!" line are revealed.
 */
const HomePage = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [started, setStarted] = useState(false)

  /* Create the audio element for background music */
  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/cat_meme_sound.mp3`)
    audio.loop = false
    audio.volume = 0.4
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  /* "Heyy!" handler: starts the music, notifies you, and reveals the rest. */
  const handleStart = useCallback(() => {
    if (started) return
    audioRef.current?.play().catch(() => undefined)
    setStarted(true)
    notifyVisit()
  }, [started])

  const loveDelay = 0.35 + TAGLINE_WORDS.length * 0.11 + 0.25

  return (
    <Page>
      <BgGradient />
      {started && (
        <FloatingFaces
          src={`${import.meta.env.BASE_URL}optimus_smiling.png`}
          count={16}
          onPoke={playPokeSfx}
        />
      )}

      <Content>
        {!unlocked ? (
          <PasswordGate onUnlock={() => setUnlocked(true)} />
        ) : !started ? (
          <StartGate>
            <HeyyButton
              type="button"
              onClick={handleStart}
              whileHover={{ y: -3, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Heyy!
            </HeyyButton>
            <Credit>Created by Excellent_Torch</Credit>
          </StartGate>
        ) : (
          <Reveal>
            <GifWrap>
              <CatGif
                src={`${import.meta.env.BASE_URL}oia-dancing-cat.gif`}
                alt="A dancing cat grooving to the music"
              />
            </GifWrap>

            <LyricReveal text={TAGLINE_TEXT} />

            <LoveLine
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: loveDelay, duration: 0.6, ease: 'easeOut' }}
            >
              I Love You!
              <Heart aria-hidden="true">💙</Heart>
            </LoveLine>
          </Reveal>
        )}
      </Content>
    </Page>
  )
}

/** SFX played when a floating face is poked. Throttled so it stays musical. */
let lastPokeAt = 0
const playPokeSfx = () => {
  const now = performance.now()
  if (now - lastPokeAt < 90) return
  lastPokeAt = now
  playUiSound('select')
}

const Page = styled.main`
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100svh;
  overflow: hidden;
  padding: calc(env(safe-area-inset-top) + 6vh) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
`

const BgGradient = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  background: linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 50%, #1c1c1e 100%);
`

const Content = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 24px 20px;
  width: 100%;
  max-width: 480px;

  @media (max-width: 480px) {
    gap: 22px;
    padding: 20px 16px;
  }
`

const StartGate = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
`

const Credit = styled.p`
  position: absolute;
  bottom: max(20px, env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  margin: 0;
  padding: 0 20px;
  font-size: 0.78rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
`

const GifWrap = styled.div`
  width: 100%;
  max-width: 380px;

  @media (max-width: 480px) {
    max-width: min(82vw, 320px);
  }
`

const CatGif = styled.img`
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  animation: ${zoomBreathe} 3.6s ease-in-out infinite;
`

const HeyyButton = styled(motion.button)`
  min-height: 64px;
  padding: 18px 48px;
  border: 1px solid rgba(214, 233, 250, 0.6);
  border-radius: 999px;
  color: #1f7ae0;
  background: #ffffff;
  box-shadow: 0 18px 46px rgba(31, 122, 224, 0.35);
  font-weight: 900;
  font-size: 1.6rem;
  letter-spacing: 0.04em;
  cursor: pointer;
`

const Reveal = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  width: 100%;
  animation: ${floatIn} 0.5s ease-out both;

  @media (max-width: 480px) {
    gap: 22px;
  }
`

const Tagline = styled.p`
  margin: 0;
  font-family: 'Archivo Black', sans-serif;
  font-weight: 400;
  font-size: clamp(1.1rem, 4.5vw, 1.4rem);
  letter-spacing: 0.04em;
  line-height: 1.65;
  text-align: center;
  color: rgba(255, 255, 255, 0.82);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);

  @media (max-width: 480px) {
    font-size: clamp(1.15rem, 5.5vw, 1.6rem);
    line-height: 1.7;
    letter-spacing: 0.02em;
  }
`

const WordSpan = styled(motion.span)`
  display: inline;
  will-change: opacity, transform, filter;
`

const lovePulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
`

const LoveLine = styled(motion.p)`
  margin: 4px 0 0;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: 'Archivo Black', sans-serif;
  font-weight: 400;
  font-size: clamp(2rem, 9vw, 3.2rem);
  color: #cfe4ff;
  text-shadow: 0 2px 16px rgba(59, 130, 246, 0.6);
  animation: ${lovePulse} 2.4s ease-in-out infinite;
`

const Heart = styled.span`
  display: inline-block;
  font-size: 1.2em;
  animation: ${heartGlow} 1.6s ease-in-out infinite;
`

export default HomePage
