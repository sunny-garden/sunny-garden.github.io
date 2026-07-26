import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { audioPaths } from '../../data/proposalContent'
import { playUiSound } from '../../services/soundEffects'
import type { SfxContextValue, SfxName } from '../../types/proposal'
import { SfxContext } from './sfxContext'

interface SFXManagerProps {
  children: ReactNode
}

const sources: Record<SfxName, string> = {
  no: audioPaths.sfxNo,
  yes: audioPaths.sfxYes,
}

const volumes: Record<SfxName, number> = {
  no: 0.6,
  yes: 0.7,
}

// If a real `.mp3` is missing, fall back to a synthesised tone so the
// experience still has audible feedback during development.
const fallbackTone: Record<SfxName, 'evade' | 'celebrate'> = {
  no: 'evade',
  yes: 'celebrate',
}

/**
 * Provides `playSfx` to the proposal experience. Each effect is backed by an
 * `<audio>` file in `public/audio/`; missing or blocked files degrade
 * gracefully to a synthesised tone and never throw.
 */
const SFXManager = ({ children }: SFXManagerProps) => {
  const playersRef = useRef<Partial<Record<SfxName, HTMLAudioElement>>>({})

  useEffect(() => {
    const players = playersRef.current
    ;(Object.keys(sources) as SfxName[]).forEach((name) => {
      const audio = new Audio(sources[name])
      audio.preload = 'auto'
      audio.volume = volumes[name]
      players[name] = audio
    })

    return () => {
      ;(Object.keys(players) as SfxName[]).forEach((name) => {
        players[name]?.pause()
        delete players[name]
      })
    }
  }, [])

  const playSfx = useCallback((name: SfxName) => {
    const audio = playersRef.current[name]
    const fallback = () => playUiSound(fallbackTone[name])

    if (!audio) {
      fallback()
      return
    }

    try {
      audio.currentTime = 0
      const playback = audio.play()
      if (playback) {
        playback.catch(() => fallback())
      }
    } catch {
      fallback()
    }
  }, [])

  const value = useMemo<SfxContextValue>(() => ({ playSfx }), [playSfx])

  return <SfxContext.Provider value={value}>{children}</SfxContext.Provider>
}

export default SFXManager
