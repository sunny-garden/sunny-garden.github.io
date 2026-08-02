import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styled from 'styled-components'
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
            initial={{ opacity: 0, y: 38, filter: 'blur(10px)', scale: 0.96 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, y: -26, filter: 'blur(8px)', scale: 1.02 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {current.text}
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
  pointer-events: none;
`

const Line = styled(motion.p)`
  max-width: 18ch;
  margin: 0;
  color: #f3f9ff;
  font-family: var(--serif);
  font-size: clamp(1.9rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  text-wrap: balance;
  text-shadow:
    0 2px 24px rgba(52, 166, 245, 0.55),
    0 1px 2px rgba(0, 0, 0, 0.4);
`

export default LyricOverlay
