import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'

interface Particle {
  id: number
  left: number
  top: number
  size: number
  drift: number
  delay: number
  duration: number
  rotate: number
}

interface FloatingFacesProps {
  /** Absolute image URL for the floating particle. */
  src: string
  /** Number of particles to render. */
  count?: number
  /** Fires when a face is poked/touched by the pointer. */
  onPoke?: () => void
}

const drift = keyframes`
  0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
  50%  { transform: translate3d(var(--drift-x), var(--drift-y), 0) rotate(var(--rot)); }
  100% { transform: translate3d(0, 0, 0) rotate(0deg); }
`

const bob = keyframes`
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 0.7; }
`

/**
 * Animated, interactive background of floating PNG faces. On pointer move, the
 * nearest particles gently nudge away from the cursor and drift back. Pure CSS
 * animations handle ambient motion, while a single pointer listener provides
 * the interactive parallax (kept cheap with transforms only).
 */
const FloatingFaces = ({ src, count = 14, onPoke }: FloatingFacesProps) => {
  const layerRef = useRef<HTMLDivElement>(null)
  const [pointer, setPointer] = useState({ x: 50, y: 50 })

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, id) => {
        const size = 36 + ((id * 13) % 64)
        return {
          id,
          left: (id * 37) % 100,
          top: (id * 61) % 100,
          size,
          drift: 24 + ((id * 7) % 48),
          delay: (id % 7) * 0.5,
          duration: 6 + ((id * 3) % 6),
          rotate: ((id * 23) % 80) - 40,
        }
      }),
    [count],
  )

  /**
   * Listen on `window` so the parallax reacts to touches anywhere on the page,
   * not just over the layer. On touch devices `pointermove` only fires while a
   * finger is down, so we also track `pointerdown` to register the first tap.
   * When the pointer is close enough to a face, fire `onPoke`.
   */
  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      const rect = layerRef.current?.getBoundingClientRect()
      if (!rect) return
      const px = ((event.clientX - rect.left) / rect.width) * 100
      const py = ((event.clientY - rect.top) / rect.height) * 100
      setPointer({ x: px, y: py })

      if (onPoke) {
        // Pointer is in "push" range of at least one particle -> counts as a poke.
        const nearAny = particles.some((p) => Math.hypot(p.left - px, p.top - py) < 28)
        if (nearAny) onPoke()
      }
    }

    window.addEventListener('pointermove', handlePointer, { passive: true })
    window.addEventListener('pointerdown', handlePointer, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointer)
      window.removeEventListener('pointerdown', handlePointer)
    }
  }, [particles, onPoke])

  return (
    <Layer ref={layerRef} aria-hidden="true">
      {particles.map((p) => {
        const dx = p.left - pointer.x
        const dy = p.top - pointer.y
        const dist = Math.hypot(dx, dy)
        const push = dist < 28 ? (28 - dist) * 1.4 : 0
        const angle = Math.atan2(dy, dx)
        const tx = `${(Math.cos(angle) * push).toFixed(1)}px`
        const ty = `${(Math.sin(angle) * push).toFixed(1)}px`

        return (
          <FaceWrap
            key={p.id}
            $left={p.left}
            $top={p.top}
            style={{
              transform: `translate(${tx}, ${ty})`,
              transition: 'transform 0.18s ease-out',
            }}
          >
            <Face
              src={src}
              alt=""
              $size={p.size}
              $driftX={`${p.drift}px`}
              $driftY={`${-p.drift}px`}
              $rot={`${p.rotate}deg`}
              $delay={p.delay}
              $duration={p.duration}
            />
          </FaceWrap>
        )
      })}
    </Layer>
  )
}

const Layer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
`

const FaceWrap = styled.div<{ $left: number; $top: number }>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  will-change: transform;
`

const Face = styled.img<{
  $size: number
  $driftX: string
  $driftY: string
  $rot: string
  $delay: number
  $duration: number
}>`
  display: block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  object-fit: contain;
  border-radius: 50%;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.35));
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  opacity: 0.4;
  animation:
    ${drift} ${({ $duration }) => $duration}s ease-in-out ${({ $delay }) => $delay}s infinite,
    ${bob} 4s ease-in-out ${({ $delay }) => $delay}s infinite;
`

export default FloatingFaces
