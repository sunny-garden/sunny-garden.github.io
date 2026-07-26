import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import { audioPaths } from '../../data/proposalContent'

interface AudioPlayerProps {
  /** Looping background track. Defaults to the bundled placeholder path. */
  src?: string
  /** Playback volume between 0 and 1. */
  volume?: number
}

/**
 * Floating background-music control. Audio is muted (paused) by default and
 * only starts after the listener opts in, satisfying browser autoplay rules.
 * A missing or blocked file fails silently and the control stays in the off
 * state.
 */
const AudioPlayer = ({ src = audioPaths.bgMusic, volume = 0.4 }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isOn, setIsOn] = useState(false)

  useEffect(() => {
    const audio = new Audio(src)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = volume
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [src, volume])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (isOn) {
      audio.pause()
      setIsOn(false)
      return
    }

    const playback = audio.play()
    if (playback) {
      playback.then(() => setIsOn(true)).catch(() => setIsOn(false))
    } else {
      setIsOn(true)
    }
  }, [isOn])

  return (
    <Toggle
      type="button"
      onClick={toggle}
      aria-pressed={isOn}
      aria-label={isOn ? 'Mute background music' : 'Play background music'}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.94 }}
    >
      <Equalizer $on={isOn} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </Equalizer>
      <Label>{isOn ? 'Music on' : 'Music off'}</Label>
    </Toggle>
  )
}

const Toggle = styled(motion.button)`
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 55;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 16px 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  color: var(--blue-deep);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 14px 32px rgba(7, 60, 116, 0.22);
  backdrop-filter: blur(14px);
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
`

const Equalizer = styled.span<{ $on: boolean }>`
  display: inline-flex;
  align-items: flex-end;
  gap: 3px;
  height: 18px;

  span {
    width: 3px;
    height: 6px;
    border-radius: 2px;
    background: linear-gradient(180deg, var(--blue-bright), var(--blue-deep));
    transform-origin: bottom;
    animation: ${({ $on }) => ($on ? 'eq-bounce 0.9s ease-in-out infinite' : 'none')};
  }

  span:nth-child(1) {
    height: 14px;
    animation-delay: -0.2s;
  }

  span:nth-child(2) {
    height: 18px;
    animation-delay: -0.45s;
  }

  span:nth-child(3) {
    height: 10px;
    animation-delay: -0.1s;
  }

  span:nth-child(4) {
    height: 16px;
    animation-delay: -0.35s;
  }

  @keyframes eq-bounce {
    0%,
    100% {
      transform: scaleY(0.4);
    }
    50% {
      transform: scaleY(1);
    }
  }
`

const Label = styled.span`
  white-space: nowrap;
`

export default AudioPlayer
