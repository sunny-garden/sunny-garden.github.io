import { useCallback, useRef, useState, type PointerEvent } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import styled from 'styled-components'
import { audioPaths } from '../../data/proposalContent'
import type { LyricLine } from '../../types/proposal'
import LyricOverlay from './LyricOverlay'
import GardenCat from './GardenCat'
import { FishGlyph, PawGlyph } from './CatGlyphs'

interface IntroProps {
  lyrics: LyricLine[]
  /** Voiceover source. Defaults to the bundled placeholder path. */
  voSrc?: string
  /** Fires when the intro finishes or is skipped. */
  onFinish: () => void
}

const farField = Array.from({ length: 16 }, (_, index) => ({
  left: `${(index * 61) % 100}%`,
  top: `${(index * 37) % 100}%`,
  size: 3 + ((index * 7) % 5),
  delay: (index % 6) * 0.4,
}))

const midField = [
  { left: '12%', top: '24%', kind: 'fish' as const, size: 30 },
  { left: '78%', top: '20%', kind: 'paw' as const, size: 26 },
  { left: '20%', top: '70%', kind: 'paw' as const, size: 24 },
  { left: '84%', top: '66%', kind: 'fish' as const, size: 32 },
  { left: '50%', top: '14%', kind: 'fish' as const, size: 22 },
  { left: '64%', top: '80%', kind: 'paw' as const, size: 20 },
]

/**
 * Full-screen animated intro: a start gate (required so audio may play), then a
 * 3D parallax scene with the mecha-cat, a voiceover and
 * lyric-style text synced to the supplied `lyrics`.
 */
const Intro = ({ lyrics, voSrc = audioPaths.intro, onFinish }: IntroProps) => {
  const [phase, setPhase] = useState<'gate' | 'playing'>('gate')
  const voRef = useRef<HTMLAudioElement>(null)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 110, damping: 22 })
  const smoothY = useSpring(pointerY, { stiffness: 110, damping: 22 })
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [16, -16])
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [-13, 13])

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      pointerX.set(event.clientX / window.innerWidth - 0.5)
      pointerY.set(event.clientY / window.innerHeight - 0.5)
    },
    [pointerX, pointerY],
  )

  const begin = useCallback(() => {
    const audio = voRef.current
    if (audio) {
      audio.currentTime = 0
      const playback = audio.play()
      if (playback) {
        playback.catch(() => undefined)
      }
    }
    setPhase('playing')
  }, [])

  const finish = useCallback(() => {
    voRef.current?.pause()
    onFinish()
  }, [onFinish])

  return (
    <Root
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onPointerMove={phase === 'playing' ? handlePointerMove : undefined}
    >
      {/*
        Voiceover for the intro.
        Expected file: public/audio/megatron-vo.mp3
        Format: MP3 (~128 kbps, mono or stereo). Keep it around 20-25s so it
        lines up with the lyric `delay` timings in proposalContent.ts.
        A missing file is ignored so the intro never crashes.
      */}
      <audio ref={voRef} src={voSrc} preload="auto" />

      <AnimatePresence mode="wait">
        {phase === 'gate' ? (
          <Gate
            key="gate"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.45 }}
          >
            <GateGlow aria-hidden="true" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
            >
              <GardenCat mood="neutral" glow size={150} />
            </motion.div>
            <GateKicker>Transmission Incoming</GateKicker>
            <GateTitle>A small steel cat has something to say.</GateTitle>
            <GateHint>Best experienced with sound on.</GateHint>
            <BeginButton
              type="button"
              onClick={begin}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlayIcon aria-hidden="true" />
              Press paw to begin
            </BeginButton>
          </Gate>
        ) : (
          <Scene
            key="scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Stage style={{ rotateX, rotateY }}>
              <LayerFar aria-hidden="true">
                {farField.map((dot, index) => (
                  <Star
                    key={index}
                    $left={dot.left}
                    $top={dot.top}
                    $size={dot.size}
                    animate={{ opacity: [0.15, 0.7, 0.15] }}
                    transition={{
                      duration: 3.4,
                      delay: dot.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </LayerFar>

              <LayerMid aria-hidden="true">
                {midField.map((item, index) => (
                  <MidGlyph
                    key={index}
                    $left={item.left}
                    $top={item.top}
                    animate={{ y: [0, index % 2 === 0 ? -16 : 16, 0] }}
                    transition={{
                      duration: 6 + index,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {item.kind === 'fish' ? (
                      <FishGlyph size={item.size} />
                    ) : (
                      <PawGlyph size={item.size} />
                    )}
                  </MidGlyph>
                ))}
              </LayerMid>

              <HeroDepth>
                <motion.div
                  animate={{ y: [0, -16, 0], rotate: [-1.5, 1.5, -1.5] }}
                  transition={{ duration: 5.2, ease: 'easeInOut', repeat: Infinity }}
                >
                  <GardenCat mood="plead" glow size={210} />
                </motion.div>
              </HeroDepth>
            </Stage>

            <LyricOverlay lines={lyrics} onComplete={finish} />

            <SkipButton type="button" onClick={finish} whileHover={{ x: 2 }} whileTap={{ scale: 0.96 }}>
              Skip intro
            </SkipButton>
          </Scene>
        )}
      </AnimatePresence>
    </Root>
  )
}

const Root = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 30;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 30%, rgba(15, 60, 104, 0.7), transparent 60%),
    linear-gradient(180deg, #06121f 0%, #0a2742 55%, #06121f 100%);
`

const Gate = styled(motion.div)`
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 14px;
  padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom));
  text-align: center;
`

const GateGlow = styled.div`
  position: absolute;
  top: 28%;
  left: 50%;
  width: min(560px, 80vw);
  height: min(560px, 80vw);
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(52, 166, 245, 0.28), transparent 65%);
  pointer-events: none;
`

const GateKicker = styled.p`
  margin: 4px 0 0;
  color: #6fc0ff;
  font-size: 0.86rem;
  font-weight: 900;
  letter-spacing: 0.26em;
  text-transform: uppercase;
`

const GateTitle = styled.h1`
  max-width: 16ch;
  margin: 0;
  color: #f3f9ff;
  font-family: var(--serif);
  font-size: clamp(1.8rem, 5vw, 3.2rem);
  font-weight: 700;
  line-height: 1.1;
  text-wrap: balance;
`

const GateHint = styled.p`
  margin: 0;
  color: rgba(214, 233, 250, 0.72);
  font-size: 0.98rem;
`

const BeginButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  min-height: 56px;
  padding: 16px 30px;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--blue-bright), var(--blue-deep));
  box-shadow: 0 18px 46px rgba(11, 104, 189, 0.5);
  font-weight: 900;
  font-size: 1.05rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
`

const PlayIcon = styled.span`
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 12px solid #ffffff;
`

const Scene = styled(motion.div)`
  position: absolute;
  inset: 0;
  perspective: 1100px;
`

const Stage = styled(motion.div)`
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
`

const LayerFar = styled.div`
  position: absolute;
  inset: 0;
  transform: translateZ(-300px) scale(1.35);
`

const Star = styled(motion.span)<{ $left: string; $top: string; $size: number }>`
  position: absolute;
  left: ${({ $left }) => $left};
  top: ${({ $top }) => $top};
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 999px;
  background: #bfe3ff;
  box-shadow: 0 0 8px rgba(120, 200, 255, 0.8);
`

const LayerMid = styled.div`
  position: absolute;
  inset: 0;
  transform: translateZ(-140px) scale(1.16);
  color: rgba(120, 196, 255, 0.5);
`

const MidGlyph = styled(motion.span)<{ $left: string; $top: string }>`
  position: absolute;
  left: ${({ $left }) => $left};
  top: ${({ $top }) => $top};
  display: block;
  filter: blur(0.4px) drop-shadow(0 0 10px rgba(52, 166, 245, 0.45));
`

const HeroDepth = styled.div`
  position: absolute;
  top: 46%;
  left: 50%;
  transform: translate(-50%, -50%) translateZ(40px);
`

const SkipButton = styled(motion.button)`
  position: absolute;
  top: max(18px, env(safe-area-inset-top));
  right: max(18px, env(safe-area-inset-right));
  z-index: 6;
  min-height: 48px;
  padding: 10px 18px;
  border: 1px solid rgba(190, 224, 255, 0.4);
  border-radius: 999px;
  color: #e6f3ff;
  background: rgba(10, 39, 66, 0.55);
  backdrop-filter: blur(8px);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
`

export default Intro
