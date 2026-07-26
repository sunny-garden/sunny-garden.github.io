import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'

interface NoButtonProps {
  /** Cycling labels; advances each time the button evades. */
  labels: string[]
  /** Fired on every successful dodge. */
  onEvade?: () => void
}

const EDGE_MARGIN = 16

/**
 * The NO button that refuses to be caught. On hover, focus or pointer-down it
 * leaps to a fresh random spot in the viewport and cycles to the next label.
 */
const NoButton = ({ labels, onEvade }: NoButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null)
  const [roaming, setRoaming] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [labelIndex, setLabelIndex] = useState(0)

  const evade = useCallback(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const rect = element.getBoundingClientRect()
    const maxX = Math.max(EDGE_MARGIN, window.innerWidth - rect.width - EDGE_MARGIN)
    const maxY = Math.max(EDGE_MARGIN, window.innerHeight - rect.height - EDGE_MARGIN)
    const startX = roaming ? pos.x : rect.left
    const startY = roaming ? pos.y : rect.top
    const safeDistance = Math.min(window.innerWidth, window.innerHeight) * 0.32

    let targetX = startX
    let targetY = startY
    for (let attempt = 0; attempt < 10; attempt += 1) {
      targetX = EDGE_MARGIN + Math.random() * (maxX - EDGE_MARGIN)
      targetY = EDGE_MARGIN + Math.random() * (maxY - EDGE_MARGIN)
      if (Math.hypot(targetX - startX, targetY - startY) > safeDistance) {
        break
      }
    }

    if (!roaming) {
      setRoaming(true)
      setPos({ x: startX, y: startY })
      window.requestAnimationFrame(() => setPos({ x: targetX, y: targetY }))
    } else {
      setPos({ x: targetX, y: targetY })
    }

    setLabelIndex((current) => (current + 1) % labels.length)
    onEvade?.()
  }, [labels.length, onEvade, pos.x, pos.y, roaming])

  useEffect(() => {
    if (!roaming) {
      return
    }
    const clampIntoView = () => {
      setPos((current) => {
        const element = ref.current
        const width = element?.offsetWidth ?? 0
        const height = element?.offsetHeight ?? 0
        const maxX = Math.max(EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN)
        const maxY = Math.max(EDGE_MARGIN, window.innerHeight - height - EDGE_MARGIN)
        return {
          x: Math.min(current.x, maxX),
          y: Math.min(current.y, maxY),
        }
      })
    }
    window.addEventListener('resize', clampIntoView)
    return () => window.removeEventListener('resize', clampIntoView)
  }, [roaming])

  return (
    <Evader
      ref={ref}
      type="button"
      $roaming={roaming}
      onMouseEnter={evade}
      onPointerDown={evade}
      onFocus={evade}
      onClick={evade}
      animate={roaming ? { x: pos.x, y: pos.y } : undefined}
      transition={{ type: 'spring', stiffness: 480, damping: 24 }}
      aria-label="No"
    >
      {labels[labelIndex]}
    </Evader>
  )
}

const Evader = styled(motion.button)<{ $roaming: boolean }>`
  ${({ $roaming }) =>
    $roaming
      ? `position: fixed; left: 0; top: 0; z-index: 60;`
      : `position: relative; z-index: 5;`}
  min-height: 52px;
  padding: 14px 26px;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 28px rgba(7, 60, 116, 0.16);
  font-weight: 800;
  font-size: 1rem;
  white-space: nowrap;
  cursor: pointer;
  will-change: transform;
`

export default NoButton
