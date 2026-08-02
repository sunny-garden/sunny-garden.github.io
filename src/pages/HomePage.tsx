import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import RoseBouquet from '../components/home/RoseBouquet'
import MailLetter from '../components/home/MailLetter'
import LyricOverlay from '../components/proposal/LyricOverlay'
import { audioPaths } from '../data/proposalContent'
import { songLyrics } from '../data/songLyrics'

type Stage = 'idle' | 'playing' | 'presented'

/** Seconds before the song ends when the crossfade to background music starts. */
const SONG_FADE_SECONDS = 2.5
/** Volume the looping background music ramps up to. */
const BG_MUSIC_VOLUME = 0.55

/** Ramp an audio element's volume linearly from its current level to `target`. */
const rampVolume = (audio: HTMLAudioElement, target: number, seconds: number) => {
  const start = audio.volume
  const steps = Math.max(1, Math.round(seconds * 20))
  const delta = (target - start) / steps
  let step = 0
  const timer = window.setInterval(() => {
    step += 1
    audio.volume = start + delta * step
    if (step >= steps) {
      window.clearInterval(timer)
    }
  }, 50)
}

const HomePage = () => {
  const [stage, setStage] = useState<Stage>('idle')
  const [playFailed, setPlayFailed] = useState(false)
  const songRef = useRef<HTMLAudioElement | null>(null)
  const bgMusicRef = useRef<HTMLAudioElement | null>(null)
  const crossfadeStartedRef = useRef(false)
  const reduceMotion = useReducedMotion()
  const baseUrl = import.meta.env.BASE_URL

  const readAudioTime = useCallback(() => songRef.current?.currentTime ?? 0, [])

  useEffect(() => {
    const song = songRef.current
    const bg = bgMusicRef.current
    if (bg) {
      bg.volume = 0
    }
    return () => {
      song?.pause()
      bg?.pause()
    }
  }, [])

  const startSong = useCallback(() => {
    setStage((current) => {
      if (current !== 'idle') {
        return current
      }
      setPlayFailed(false)
      crossfadeStartedRef.current = false
      const audio = songRef.current
      if (audio) {
        audio.currentTime = 0
        const playback = audio.play()
        if (playback) {
          playback.catch(() => {
            setPlayFailed(true)
            setStage('idle')
          })
        }
      }
      return 'playing'
    })
  }, [])

  const handleEnded = useCallback(() => setStage('presented'), [])

  const handleError = useCallback(() => {
    setPlayFailed(true)
    setStage('idle')
  }, [])

  const handleSongTimeUpdate = useCallback(() => {
    if (crossfadeStartedRef.current) {
      return
    }
    const song = songRef.current
    const bg = bgMusicRef.current
    if (!song || !bg) {
      return
    }
    const duration = song.duration
    if (!Number.isFinite(duration) || duration - song.currentTime > SONG_FADE_SECONDS) {
      return
    }
    crossfadeStartedRef.current = true

    const playback = bg.play()
    if (playback) {
      playback.catch(() => undefined)
    }
    if (reduceMotion) {
      bg.volume = BG_MUSIC_VOLUME
      return
    }
    bg.volume = 0
    rampVolume(song, 0, SONG_FADE_SECONDS)
    rampVolume(bg, BG_MUSIC_VOLUME, SONG_FADE_SECONDS)
  }, [reduceMotion])

  const presented = stage === 'presented'

  return (
    <Page>
      <BackgroundImage
        src={`${baseUrl}background.webp`}
        alt=""
        width="1672"
        height="941"
        fetchPriority="high"
      />
      <Atmosphere aria-hidden="true" />
      <TextSpace aria-label="Space reserved for a personal message" />

      <CharacterFrame
        initial={false}
        animate={{
          x: presented && !reduceMotion ? [0, -8, 0] : 0,
          rotate: presented && !reduceMotion ? [0, -0.7, 0] : 0,
        }}
        transition={{ delay: 2.25, duration: 1.1, ease: 'easeInOut' }}
      >
        <CharacterImage
          src={`${baseUrl}female_character.webp`}
          alt="A woman receiving a bouquet in a sunny garden"
          width="864"
          height="1820"
        />
      </CharacterFrame>

      <BouquetStage
        initial={false}
        animate={{
          x: presented ? 'var(--bouquet-handoff-x)' : 0,
          y: presented ? 'clamp(-34px, -4vh, -14px)' : 'clamp(0px, 0vh, 0px)',
          rotate: presented ? 6 : -7,
        }}
        transition={{
          delay: reduceMotion ? 0 : 1.95,
          duration: reduceMotion ? 0.01 : 1.25,
          type: reduceMotion ? 'tween' : 'spring',
          stiffness: 74,
          damping: 15,
        }}
      >
        <RoseBouquet presented={presented} />
      </BouquetStage>

      {presented && <MailLetter />}

      {stage === 'playing' && (
        <SongOverlay>
          <Backdrop aria-hidden="true" />
          <LyricOverlay lines={songLyrics} currentTime={readAudioTime} />
        </SongOverlay>
      )}

      <audio
        ref={songRef}
        src={audioPaths.nightChanges}
        preload="auto"
        onEnded={handleEnded}
        onError={handleError}
        onTimeUpdate={handleSongTimeUpdate}
      />
      <audio ref={bgMusicRef} src={audioPaths.bgMusic} loop preload="auto" />

      {stage === 'idle' && (
        <GiveButton
          type="button"
          onClick={startSong}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.4, ease: 'easeOut' }}
          whileHover={reduceMotion ? undefined : { y: -4, scale: 1.025 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        >
          <ButtonRose aria-hidden="true">✦</ButtonRose>
          Uhm
        </GiveButton>
      )}
      <CompletionStatus id="flower-status" role="status" aria-live="polite" aria-atomic="true">
        {presented
          ? 'Bouquet presented.'
          : playFailed
            ? 'Could not play the song. Please try again.'
            : ''}
      </CompletionStatus>
    </Page>
  )
}

const drift = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -10px, 0); }
`

const Page = styled.main`
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  isolation: isolate;
  background: #d8d293;
`

const BackgroundImage = styled.img`
  position: absolute;
  z-index: 0;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: cover;
  object-position: 54% center;

  @media (max-width: 720px) {
    object-position: 54% center;
  }

  @media (max-width: 420px) {
    object-position: 54% center;
  }
`

const Atmosphere = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 28% 20%, rgba(255, 244, 180, 0.4), transparent 28%),
    linear-gradient(to top, rgba(20, 83, 47, 0.16), transparent 42%);

  &::after {
    position: absolute;
    top: 12%;
    right: 18%;
    width: clamp(110px, 16vw, 240px);
    aspect-ratio: 1;
    border-radius: 50%;
    background: rgba(255, 248, 195, 0.12);
    filter: blur(32px);
    animation: ${drift} 5.5s ease-in-out infinite;
    content: '';
  }

  @media (prefers-reduced-motion: reduce) {
    &::after {
      animation: none;
    }
  }
`

const TextSpace = styled.section`
  position: absolute;
  z-index: 3;
  top: max(8vh, calc(env(safe-area-inset-top) + 32px));
  right: max(5vw, calc(env(safe-area-inset-right) + 24px));
  width: min(38vw, 520px);
  min-height: clamp(128px, 24vh, 250px);
  text-align: right;

  @media (max-width: 720px) {
    right: calc(env(safe-area-inset-right) + 20px);
    left: calc(env(safe-area-inset-left) + 20px);
    width: auto;
    min-height: 118px;
    text-align: center;
  }
`

const CharacterFrame = styled(motion.figure)`
  position: absolute;
  z-index: 2;
  left: clamp(-50px, 1vw, 22px);
  bottom: -3vh;
  width: clamp(310px, 36vw, 570px);
  height: min(88vh, 880px);
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 248, 218, 0.38);
  border-radius: 48% 48% 14% 14% / 18% 18% 8% 8%;
  box-shadow:
    0 28px 80px rgba(39, 78, 43, 0.3),
    inset 0 0 70px rgba(255, 244, 190, 0.2);
  -webkit-mask-image:
    linear-gradient(to bottom, transparent 0, #000 10%, #000 87%, transparent 100%),
    linear-gradient(to right, transparent 0, #000 10%, #000 90%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to bottom, transparent 0, #000 10%, #000 87%, transparent 100%),
    linear-gradient(to right, transparent 0, #000 10%, #000 90%, transparent 100%);
  mask-composite: intersect;
  transform-origin: bottom center;

  @media (max-width: 720px) {
    left: -60px;
    bottom: 0;
    width: min(58vw, 320px);
    height: min(65vh, 600px);
  }

  @media (max-width: 420px) {
    left: -44px;
    width: min(55vw, 260px);
    height: min(60vh, 500px);
  }

  @media (max-height: 620px) {
    width: clamp(264px, 30.6vw, 485px);
  }

  @media (max-width: 720px) and (max-height: 620px) {
    width: min(50vw, 280px);
  }
`

const CharacterImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 19%;
  filter: saturate(0.94) contrast(1.02) brightness(1.03);
`

const BouquetStage = styled(motion.div)`
  --bouquet-handoff-x: clamp(-70px, -4vw, -24px);

  position: absolute;
  z-index: 4;
  right: 42%;
  bottom: 5vh;
  width: clamp(260px, 29vw, 440px);
  transform-origin: 50% 100%;
  filter: drop-shadow(0 22px 24px rgba(36, 72, 42, 0.28));

  @media (max-width: 720px) {
    --bouquet-handoff-x: clamp(-38px, -5vw, -18px);

    right: -2vw;
    left: auto;
    bottom: 6.5vh;
    width: min(68vw, 320px);
  }

  @media (max-width: 420px) {
    right: -3vw;
    width: min(70vw, 286px);
  }

  @media (max-height: 620px) {
    width: clamp(221px, 24.65vw, 374px);
  }

  @media (max-width: 720px) and (max-height: 620px) {
    width: min(60vw, 270px);
  }
`

const GiveButton = styled(motion.button)`
  position: absolute;
  z-index: 5;
  right: clamp(24px, 13vw, 190px);
  bottom: max(7vh, calc(env(safe-area-inset-bottom) + 24px));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 58px;
  padding: 12px 28px;
  border: 1px solid rgba(255, 249, 224, 0.94);
  border-radius: 999px;
  color: #173f2c;
  background: #fff7dc;
  box-shadow: 0 16px 38px rgba(96, 55, 22, 0.28);
  font: inherit;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.015em;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  &:focus-visible {
    outline: 4px solid #b9233d;
    outline-offset: 4px;
  }

  @media (max-width: 720px) {
    right: auto;
    left: 50%;
    bottom: max(4vh, calc(env(safe-area-inset-bottom) + 18px));
    max-width: calc(100% - 32px);
    translate: -50% 0;
    min-height: 56px;
    padding: 14px 32px;
    font-size: 1.05rem;
  }

  @media (max-width: 420px) {
    padding: 14px 28px;
    min-height: 52px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`

const ButtonRose = styled.span`
  display: inline-grid;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 50%;
  color: #fff7dc;
  background: #bd2440;
  font-size: 1rem;
  line-height: 1;
`

const SongOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
`

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 60%, rgba(6, 18, 31, 0.28), rgba(6, 18, 31, 0.66));
`

const CompletionStatus = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`

export default HomePage
