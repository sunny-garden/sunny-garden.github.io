import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import { getActiveLyricIndex } from '../../data/songLyrics'
import type { LyricLine } from '../../types/proposal'

interface LyricOverlayProps {
  lines: LyricLine[]
  /**
   * Optional live audio clock in seconds. When provided, lines advance by
   * polling this clock instead of wall-clock timers, so they stay aligned
   * with playback. The function should be stable across renders
   * (useCallback). `onComplete` is only used in timer mode.
   */
  currentTime?: () => number
  /** Called once the final line has finished holding on screen. */
  onComplete?: () => void
}

const HOLD_AFTER_LAST_SECONDS = 2.8

/**
 * Lyric-video style text. Each line cross-fades in at its `delay` (seconds),
 * one at a time, then `onComplete` fires after the last line holds. The
 * timeline plays from the moment the component mounts.
 */
const LyricOverlay = ({ lines, currentTime, onComplete }: LyricOverlayProps) => {
  const [index, setIndex] = useState(-1)

  useEffect(() => {
    if (currentTime) {
      return
    }

    if (lines.length === 0) {
      const emptyTimer = window.setTimeout(() => onComplete?.(), 0)
      return () => window.clearTimeout(emptyTimer)
    }

    const timers: number[] = []
    lines.forEach((line, lineIndex) => {
      timers.push(
        window.setTimeout(() => setIndex(lineIndex), Math.max(0, line.delay) * 1000),
      )
    })

    const lastDelay = lines[lines.length - 1].delay
    timers.push(
      window.setTimeout(
        () => onComplete?.(),
        (lastDelay + HOLD_AFTER_LAST_SECONDS) * 1000,
      ),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [lines, currentTime, onComplete])

  useEffect(() => {
    if (!currentTime) {
      return
    }

    let frame = 0
    let last = -1
    const tick = () => {
      const next = getActiveLyricIndex(lines, currentTime())
      if (next !== last) {
        last = next
        setIndex(next)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [lines, currentTime])

  const current = index >= 0 ? lines[index] : null

  return (
    <Overlay aria-live="polite">
      <AnimatePresence mode="wait">
        {current ? (
          <Line
            key={index}
            initial={{ opacity: 0, y: 46, z: -36, rotateX: 16, filter: 'blur(14px)', scale: 0.93 }}
            animate={{ opacity: 1, y: 0, z: 0, rotateX: 0, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, y: -34, z: 20, rotateX: -10, filter: 'blur(12px)', scale: 1.04 }}
            transition={{ duration: 0.82, ease: [0.18, 1, 0.32, 1] }}
          >
            <DepthText aria-hidden="true">{current.text}</DepthText>
            <TextWrap>
              <TextFill>{current.text}</TextFill>
              <Shimmer aria-hidden="true">{current.text}</Shimmer>
            </TextWrap>
            <ParticleField aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </ParticleField>
          </Line>
        ) : null}
      </AnimatePresence>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  display: grid;
  place-items: center;
  padding: 0 24px;
  perspective: 900px;
  pointer-events: none;
`

const shimmerSweep = keyframes`
  0% { background-position: 160% 0; }
  42%, 100% { background-position: -80% 0; }
`

const particleDrift = keyframes`
  0%, 100% {
    opacity: 0;
    transform: translate3d(0, 8px, 0) scale(0.7);
  }
  35% {
    opacity: 0.86;
  }
  70% {
    opacity: 0.2;
    transform: translate3d(var(--drift-x), var(--drift-y), 0) scale(1);
  }
`

const Line = styled(motion.p)`
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  width: fit-content;
  max-width: min(22ch, calc(100vw - 40px));
  margin: 0;
  padding: clamp(18px, 3vw, 32px) clamp(22px, 5vw, 54px);
  color: #f3f9ff;
  font-family: var(--serif);
  font-size: clamp(1.9rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  text-wrap: balance;
  transform-style: preserve-3d;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5),
    0 4px 0 rgba(1, 19, 40, 0.18),
    0 18px 38px rgba(2, 16, 36, 0.48),
    0 2px 28px rgba(0, 0, 0, 0.62);

  @media (max-width: 420px) {
    max-width: min(19ch, calc(100vw - 28px));
    padding-inline: 16px;
  }
`

const TextWrap = styled.span`
  position: relative;
  z-index: 3;
  display: block;
  transform: translateZ(38px);
`

const TextFill = styled.span`
  display: block;
  color: transparent;
  background: linear-gradient(180deg, #ffffff 0%, #dff3ff 46%, #98d7ff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  filter:
    drop-shadow(0 2px 0 rgba(255, 255, 255, 0.18))
    drop-shadow(0 16px 22px rgba(1, 13, 32, 0.55))
    drop-shadow(0 0 24px rgba(0, 0, 0, 0.55));
`

const Shimmer = styled.span`
  position: absolute;
  inset: 0;
  display: block;
  color: transparent;
  background:
    linear-gradient(110deg, transparent 0%, transparent 34%, rgba(255, 255, 255, 0.95) 46%, rgba(172, 226, 255, 0.78) 53%, transparent 66%, transparent 100%);
  background-size: 240% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  mix-blend-mode: screen;
  animation: ${shimmerSweep} 2.7s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const DepthText = styled.span`
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 50%;
  width: 100%;
  color: rgba(1, 10, 25, 0.5);
  transform: translate3d(-48%, -43%, -34px) scale(1.03);
  filter: blur(1.2px);
  text-shadow:
    0 10px 22px rgba(0, 0, 0, 0.5),
    0 24px 44px rgba(0, 0, 0, 0.36);
`

const ParticleField = styled.span`
  position: absolute;
  z-index: 2;
  inset: -22% -10%;
  transform: translateZ(20px);

  span {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.95), rgba(109, 200, 255, 0.12) 68%, transparent 72%);
    filter: drop-shadow(0 0 10px rgba(104, 198, 255, 0.85));
    animation: ${particleDrift} 2.8s ease-in-out infinite;
  }

  span:nth-child(1) { left: 9%; top: 24%; --drift-x: -14px; --drift-y: -24px; animation-delay: -0.2s; }
  span:nth-child(2) { left: 22%; top: 77%; --drift-x: -22px; --drift-y: 18px; animation-delay: -1.4s; }
  span:nth-child(3) { right: 14%; top: 18%; --drift-x: 18px; --drift-y: -20px; animation-delay: -0.8s; }
  span:nth-child(4) { right: 8%; bottom: 18%; --drift-x: 20px; --drift-y: 17px; animation-delay: -2s; }
  span:nth-child(5) { left: 48%; top: 2%; --drift-x: 4px; --drift-y: -25px; animation-delay: -1.1s; }
  span:nth-child(6) { left: 58%; bottom: 1%; --drift-x: 10px; --drift-y: 26px; animation-delay: -2.4s; }
  span:nth-child(7) { left: 2%; top: 48%; --drift-x: -18px; --drift-y: -8px; animation-delay: -0.5s; width: 4px; height: 4px; }
  span:nth-child(8) { right: 3%; top: 55%; --drift-x: 16px; --drift-y: 12px; animation-delay: -1.7s; width: 4px; height: 4px; }
  span:nth-child(9) { left: 34%; top: 94%; --drift-x: -10px; --drift-y: -16px; animation-delay: -0.9s; width: 8px; height: 8px; }
  span:nth-child(10) { right: 26%; top: 92%; --drift-x: 12px; --drift-y: -14px; animation-delay: -2.1s; width: 8px; height: 8px; }
  span:nth-child(11) { left: 70%; top: 8%; --drift-x: -8px; --drift-y: -22px; animation-delay: -0.3s; width: 4px; height: 4px; }
  span:nth-child(12) { right: 42%; top: 4%; --drift-x: 14px; --drift-y: -18px; animation-delay: -1.6s; width: 5px; height: 5px; }
  span:nth-child(13) { left: 14%; top: 92%; --drift-x: -20px; --drift-y: -10px; animation-delay: -2.3s; width: 5px; height: 5px; }
  span:nth-child(14) { right: 18%; top: 30%; --drift-x: 22px; --drift-y: 14px; animation-delay: -0.6s; width: 4px; height: 4px; }
  span:nth-child(15) { left: 42%; top: 10%; --drift-x: -12px; --drift-y: -20px; animation-delay: -1.9s; width: 4px; height: 4px; }
  span:nth-child(16) { right: 6%; bottom: 4%; --drift-x: 18px; --drift-y: 20px; animation-delay: -2.6s; width: 7px; height: 7px; }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`

export default LyricOverlay
