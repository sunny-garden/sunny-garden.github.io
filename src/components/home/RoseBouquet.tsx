import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, RefObject } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styled, { css, keyframes } from 'styled-components'
import bouquetUrl from '../../../images/bouquet.png'
import blueRoseUrl from '../../../images/blue-rose.png'
import redRoseUrl from '../../../images/red-rose.png'
import { playUiSound } from '../../services/soundEffects'
import {
  ROSE_SLOTS,
  clampScreenDelta,
  findClosestAvailableSlot,
  getRotationVariation,
  getSlotPoint,
  isDoubleTap,
  localVectorToScreen,
  screenVectorToLocal,
  type Bounds,
  type Matrix2D,
  type Point,
  type RoseSlot,
  type TimedPoint,
} from './bouquet2d'
import {
  readSafeViewport,
  useDraggableBouquetLayer,
  type DragEndDetail,
} from './useDraggableBouquetLayer'

interface RoseBouquetProps {
  presented: boolean
}

interface RoseState {
  translation: Point
  slotId: string | null
  rotationStep: number
  rotationVariation: number
  bloomKey: number
  hasMoved: boolean
}

type LayerRegistry = RefObject<Map<string, HTMLDivElement>>

const initialRoseStates = Object.fromEntries(
  ROSE_SLOTS.map((slot) => [
    slot.id,
    {
      translation: { x: 0, y: 0 },
      slotId: slot.id,
      rotationStep: 0,
      rotationVariation: 0,
      bloomKey: 0,
      hasMoved: false,
    },
  ]),
) as Record<string, RoseState>

const readCoordinateMatrix = (root: HTMLElement | null): Matrix2D => {
  const transformedParent = root?.parentElement
  if (!transformedParent) return { a: 1, b: 0, c: 0, d: 1 }
  const transform = getComputedStyle(transformedParent).transform
  if (!transform || transform === 'none') return { a: 1, b: 0, c: 0, d: 1 }
  const matrix = new DOMMatrixReadOnly(transform)
  return { a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d }
}

interface WrapperLayerProps {
  presented: boolean
  active: boolean
  translation: Point
  rootRef: RefObject<HTMLDivElement | null>
  elementRef: RefObject<HTMLDivElement | null>
  onDragStart: (id: string) => void
  onDragEnd: (detail: DragEndDetail) => void
}

const InteractiveWrapper = ({
  presented,
  active,
  translation,
  rootRef,
  elementRef,
  onDragStart,
  onDragEnd,
}: WrapperLayerProps) => {
  const drag = useDraggableBouquetLayer({
    id: 'wrapper',
    disabled: !presented,
    translation,
    coordinateRootRef: rootRef,
    elementRef,
    onDragStart,
    onDragEnd,
  })

  return (
    <WrapperLayer
      ref={elementRef}
      role="img"
      aria-label="Draggable navy and cream bouquet wrapper"
      $active={active}
      $presented={presented}
      style={
        {
          '--drag-x': `${translation.x}px`,
          '--drag-y': `${translation.y}px`,
        } as CSSProperties
      }
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <WrapperHeld $active={active}>
        <WrapperSway>
          <WrapperImage src={bouquetUrl} alt="" width="1024" height="1536" draggable={false} />
          <RibbonCrop aria-hidden="true">
            <RibbonImage src={bouquetUrl} alt="" width="1024" height="1536" draggable={false} />
          </RibbonCrop>
        </WrapperSway>
      </WrapperHeld>
    </WrapperLayer>
  )
}

interface RoseLayerProps {
  slot: RoseSlot
  index: number
  state: RoseState
  presented: boolean
  active: boolean
  rootRef: RefObject<HTMLDivElement | null>
  registry: LayerRegistry
  onDragStart: (id: string) => void
  onDragEnd: (detail: DragEndDetail) => void
  onTap: (id: string, point: Point) => void
}

const InteractiveRose = ({
  slot,
  index,
  state,
  presented,
  active,
  rootRef,
  registry,
  onDragStart,
  onDragEnd,
  onTap,
}: RoseLayerProps) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const drag = useDraggableBouquetLayer({
    id: slot.id,
    disabled: !presented,
    translation: state.translation,
    coordinateRootRef: rootRef,
    elementRef,
    onDragStart,
    onDragEnd,
    onTap,
  })

  useEffect(() => {
    const elements = registry.current
    const element = elementRef.current
    if (element) elements.set(slot.id, element)
    return () => {
      elements.delete(slot.id)
    }
  }, [elementRef, registry, slot.id])

  const bloomFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    const rect = elementRef.current?.getBoundingClientRect()
    onTap(slot.id, {
      x: rect ? rect.left + rect.width / 2 : 0,
      y: rect ? rect.top + rect.height * 0.24 : 0,
    })
  }

  const imageUrl = slot.color === 'red' ? redRoseUrl : blueRoseUrl

  return (
    <RoseLayer
      ref={elementRef}
      role="button"
      aria-label={`${slot.color === 'red' ? 'Red' : 'Blue'} rose ${index + 1}. Drag to move, tap to bloom, or double-tap to turn.`}
      tabIndex={presented ? 0 : -1}
      $active={active}
      $presented={presented}
      $zIndex={slot.zIndex}
      onKeyDown={bloomFromKeyboard}
      style={
        {
          '--anchor-x': `${slot.x * 100}%`,
          '--anchor-y': `${slot.y * 100}%`,
          '--rose-width': `${slot.widthPercent}%`,
          '--drag-x': `${state.translation.x}px`,
          '--drag-y': `${state.translation.y}px`,
          '--idle-duration': `${slot.idleDuration}s`,
          '--idle-delay': `${slot.idleDelay}s`,
          '--idle-float': `${slot.float}px`,
          '--idle-sway': `${slot.sway}deg`,
          '--idle-breathe': slot.breathe,
          '--rose-rotation': `${slot.rotation + state.rotationVariation}deg`,
        } as CSSProperties
      }
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <RoseHeld $active={active}>
        <RoseIdle>
          <RoseTurn>
            <RoseBloom key={state.bloomKey} $blooming={state.bloomKey > 0}>
              <RoseImage src={imageUrl} alt="" width="1024" height="1536" draggable={false} />
            </RoseBloom>
          </RoseTurn>
        </RoseIdle>
      </RoseHeld>
    </RoseLayer>
  )
}

const RoseBouquet = ({ presented }: RoseBouquetProps) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const layerRegistryRef = useRef(new Map<string, HTMLDivElement>())
  const settledBoundsRef = useRef(new Map<string, Bounds>())
  const wrapperHasMovedRef = useRef(false)
  const lastTapsRef = useRef<Record<string, TimedPoint>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [wrapperTranslation, setWrapperTranslation] = useState<Point>({ x: 0, y: 0 })
  const [roses, setRoses] = useState(initialRoseStates)
  const reduceMotion = useReducedMotion()

  const startDrag = (id: string) => {
    playUiSound('click')
    setActiveId(id)
  }

  const finishWrapperDrag = (detail: DragEndDetail) => {
    playUiSound(detail.moved ? 'save' : 'click')
    setWrapperTranslation(detail.translation)
    if (detail.moved) {
      wrapperHasMovedRef.current = true
      settledBoundsRef.current.set('wrapper', detail.bounds)
    }
    setActiveId(null)
  }

  const finishRoseDrag = (detail: DragEndDetail) => {
    if (detail.moved) {
      playUiSound('save')
    }
    setActiveId(null)
    if (!detail.moved) return

    setRoses((current) => {
      const currentRose = current[detail.id]
      if (!currentRose) return current
      if (detail.cancelled || !wrapperRef.current) {
        settledBoundsRef.current.set(detail.id, detail.bounds)
        return {
          ...current,
          [detail.id]: {
            ...currentRose,
            translation: detail.translation,
            slotId: null,
            hasMoved: true,
          },
        }
      }

      const occupiedSlots = new Set(
        Object.entries(current)
          .filter(([id]) => id !== detail.id)
          .flatMap(([, rose]) => (rose.slotId ? [rose.slotId] : [])),
      )
      const wrapperBounds = wrapperRef.current.getBoundingClientRect()
      const slot = findClosestAvailableSlot(detail.clientPoint, wrapperBounds, occupiedSlots)
      if (!slot) {
        settledBoundsRef.current.set(detail.id, detail.bounds)
        return {
          ...current,
          [detail.id]: {
            ...currentRose,
            translation: detail.translation,
            slotId: null,
            hasMoved: true,
          },
        }
      }

      const target = getSlotPoint(slot, wrapperBounds)
      const roseHead = {
        x: detail.bounds.left + (detail.bounds.right - detail.bounds.left) * 0.5,
        y: detail.bounds.top + (detail.bounds.bottom - detail.bounds.top) * 0.24,
      }
      const screenCorrection = clampScreenDelta(
        detail.bounds,
        { x: target.x - roseHead.x, y: target.y - roseHead.y },
        readSafeViewport(),
      )
      const localCorrection = screenVectorToLocal(
        screenCorrection,
        readCoordinateMatrix(hostRef.current),
      )
      settledBoundsRef.current.set(detail.id, {
        left: detail.bounds.left + screenCorrection.x,
        top: detail.bounds.top + screenCorrection.y,
        right: detail.bounds.right + screenCorrection.x,
        bottom: detail.bounds.bottom + screenCorrection.y,
      })

      return {
        ...current,
        [detail.id]: {
          ...currentRose,
          translation: {
            x: detail.translation.x + localCorrection.x,
            y: detail.translation.y + localCorrection.y,
          },
          slotId: slot.id,
          hasMoved: true,
        },
      }
    })
  }

  const bloomRose = (id: string, point: Point) => {
    const now = performance.now()
    const previousTap = lastTapsRef.current[id]
    const currentTap = { time: now, point }
    const doubleTap = isDoubleTap(previousTap, currentTap)
    lastTapsRef.current[id] = currentTap
    playUiSound(doubleTap ? 'transition' : 'select')

    setRoses((current) => {
      const rose = current[id]
      if (!rose) return current
      const roseIndex = ROSE_SLOTS.findIndex((slot) => slot.id === id)
      const nextStep = doubleTap ? rose.rotationStep + 1 : rose.rotationStep
      return {
        ...current,
        [id]: {
          ...rose,
          bloomKey: rose.bloomKey + (doubleTap ? 0 : 1),
          rotationStep: nextStep,
          rotationVariation: doubleTap
            ? getRotationVariation(rose.rotationStep, roseIndex)
            : rose.rotationVariation,
        },
      }
    })
  }

  useEffect(() => {
    const clampAllLayers = () => {
      const matrix = readCoordinateMatrix(hostRef.current)
      const viewport = readSafeViewport()
      let responsiveWrapperBounds: Bounds | null = null

      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        const transform = getComputedStyle(wrapperRef.current).transform
        const layerMatrix =
          transform && transform !== 'none' ? new DOMMatrixReadOnly(transform) : new DOMMatrixReadOnly()
        const screenTranslation = localVectorToScreen(
          { x: layerMatrix.e, y: layerMatrix.f },
          matrix,
        )
        responsiveWrapperBounds = {
          left: rect.left - screenTranslation.x,
          top: rect.top - screenTranslation.y,
          right: rect.right - screenTranslation.x,
          bottom: rect.bottom - screenTranslation.y,
        }

        if (wrapperHasMovedRef.current) {
          const settledBounds = settledBoundsRef.current.get('wrapper')
          const desired = settledBounds
            ? { x: settledBounds.left - rect.left, y: settledBounds.top - rect.top }
            : { x: 0, y: 0 }
          const correction = clampScreenDelta(rect, desired, viewport)
          if (correction.x || correction.y) {
            const local = screenVectorToLocal(correction, matrix)
            setWrapperTranslation((current) => ({
              x: current.x + local.x,
              y: current.y + local.y,
            }))
          }
        }
      }

      setRoses((current) => {
        let changed = false
        const next = { ...current }
        for (const [id, element] of layerRegistryRef.current) {
          if (!current[id].hasMoved) continue
          const rect = element.getBoundingClientRect()
          const rose = current[id]
          const snappedSlot = rose.slotId
            ? ROSE_SLOTS.find((slot) => slot.id === rose.slotId)
            : undefined
          const target =
            snappedSlot && responsiveWrapperBounds
              ? getSlotPoint(snappedSlot, responsiveWrapperBounds)
              : null
          const settledBounds = settledBoundsRef.current.get(id)
          const desired = target
            ? {
                x: target.x - (rect.left + rect.width * 0.5),
                y: target.y - (rect.top + rect.height * 0.24),
              }
            : settledBounds
              ? { x: settledBounds.left - rect.left, y: settledBounds.top - rect.top }
              : { x: 0, y: 0 }
          const correction = clampScreenDelta(rect, desired, viewport)
          if (!correction.x && !correction.y) continue
          const local = screenVectorToLocal(correction, matrix)
          next[id] = {
            ...current[id],
            translation: {
              x: current[id].translation.x + local.x,
              y: current[id].translation.y + local.y,
            },
          }
          changed = true
        }
        return changed ? next : current
      })
    }

    let resizeFrame = 0
    let transitionTimer = 0
    const scheduleClamp = () => {
      hostRef.current?.style.setProperty('--bouquet-move-transition', 'none')
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0
        clampAllLayers()
      })
      if (transitionTimer) window.clearTimeout(transitionTimer)
      transitionTimer = window.setTimeout(() => {
        hostRef.current?.style.removeProperty('--bouquet-move-transition')
        transitionTimer = 0
      }, 180)
    }

    window.addEventListener('resize', scheduleClamp)
    return () => {
      window.removeEventListener('resize', scheduleClamp)
      if (resizeFrame) cancelAnimationFrame(resizeFrame)
      if (transitionTimer) window.clearTimeout(transitionTimer)
    }
  }, [])

  return (
    <BouquetHost
      ref={hostRef}
      role={presented ? 'group' : undefined}
      aria-label={presented ? 'An interactive bouquet of draggable red and blue roses' : undefined}
      aria-hidden={presented ? undefined : true}
      initial={false}
      animate={{ opacity: presented ? 1 : 0, scale: presented ? 1 : 0.72 }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.72,
        delay: reduceMotion ? 0 : 0.46,
        type: reduceMotion ? 'tween' : 'spring',
        stiffness: 112,
        damping: 15,
      }}
    >
      <InteractiveWrapper
        presented={presented}
        active={activeId === 'wrapper'}
        translation={wrapperTranslation}
        rootRef={hostRef}
        elementRef={wrapperRef}
        onDragStart={startDrag}
        onDragEnd={finishWrapperDrag}
      />
      {ROSE_SLOTS.map((slot, index) => (
        <InteractiveRose
          key={slot.id}
          slot={slot}
          index={index}
          state={roses[slot.id]}
          presented={presented}
          active={activeId === slot.id}
          rootRef={hostRef}
          registry={layerRegistryRef}
          onDragStart={startDrag}
          onDragEnd={finishRoseDrag}
          onTap={bloomRose}
        />
      ))}
      {presented && (
        <Instructions>
          Drag any rose or the wrapper with a mouse, finger, or stylus. Tap a rose to bloom it and
          double-tap to turn it. Drop a rose over the wrapper opening to arrange it again.
        </Instructions>
      )}
    </BouquetHost>
  )
}

const roseIdle = keyframes`
  0%, 100% {
    transform: translate3d(0, 0, 0) rotate(calc(var(--idle-sway) * -1)) scale(1);
  }
  50% {
    transform: translate3d(0, calc(var(--idle-float) * -1), 0) rotate(var(--idle-sway)) scale(var(--idle-breathe));
  }
`

const wrapperSway = keyframes`
  0%, 100% { transform: rotate(-0.45deg) skewX(-0.18deg); }
  50% { transform: rotate(0.5deg) skewX(0.2deg); }
`

const ribbonSway = keyframes`
  0%, 100% { transform: translate3d(-1px, 0, 0) rotate(-0.35deg); }
  50% { transform: translate3d(1px, -1px, 0) rotate(0.45deg); }
`

const bloom = keyframes`
  0%, 100% { transform: scale(1); filter: brightness(1) saturate(1); }
  45% { transform: scale(1.11); filter: brightness(1.13) saturate(1.08); }
`

const BouquetHost = styled(motion.div)`
  position: relative;
  display: block;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 4 / 5;
  overflow: visible;
  pointer-events: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
`

const WrapperLayer = styled.div<{ $active: boolean; $presented: boolean }>`
  position: absolute;
  z-index: ${({ $active }) => ($active ? 20 : 10)};
  right: 6%;
  bottom: 0;
  width: 88%;
  aspect-ratio: 2 / 3;
  transform: translate3d(var(--drag-x), var(--drag-y), 0);
  transition: ${({ $active }) =>
    $active
      ? 'none'
      : 'var(--bouquet-move-transition, transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1))'};
  pointer-events: ${({ $presented }) => ($presented ? 'auto' : 'none')};
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
`

const WrapperHeld = styled.div<{ $active: boolean }>`
  transform: scale(${({ $active }) => ($active ? 1.025 : 1)});
  filter: ${({ $active }) =>
    $active ? 'drop-shadow(0 18px 22px rgba(31, 47, 40, 0.34))' : 'none'};
  transition: transform 180ms ease-out, filter 180ms ease-out;
`

const WrapperSway = styled.div`
  position: relative;
  width: 100%;
  transform-origin: 50% 78%;
  animation: ${wrapperSway} 8.4s ease-in-out infinite;
  will-change: transform;
`

const WrapperImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  object-fit: contain;
`

const RibbonCrop = styled.span`
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
  clip-path: polygon(
    14% 52%,
    86% 52%,
    86% 72%,
    68% 72%,
    79% 91%,
    60% 91%,
    50% 70%,
    40% 91%,
    21% 91%,
    32% 72%,
    14% 72%
  );
  pointer-events: none;
`

const RibbonImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  transform-origin: 50% 62%;
  animation: ${ribbonSway} 6.7s ease-in-out infinite;
  pointer-events: none;
  object-fit: contain;
  will-change: transform;
`

const RoseLayer = styled.div<{ $active: boolean; $presented: boolean; $zIndex: number }>`
  position: absolute;
  z-index: ${({ $active, $zIndex }) => ($active ? 100 : $zIndex)};
  top: var(--anchor-y);
  left: var(--anchor-x);
  width: var(--rose-width);
  aspect-ratio: 2 / 3;
  outline: none;
  translate: -50% -24%;
  transform: translate3d(var(--drag-x), var(--drag-y), 0);
  transition: ${({ $active }) =>
    $active
      ? 'none'
      : 'var(--bouquet-move-transition, transform 430ms cubic-bezier(0.2, 0.82, 0.2, 1))'};
  pointer-events: ${({ $presented }) => ($presented ? 'auto' : 'none')};
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    filter: drop-shadow(0 0 8px rgba(255, 246, 194, 0.94));
  }
`

const RoseHeld = styled.div<{ $active: boolean }>`
  transform: scale(${({ $active }) => ($active ? 1.045 : 1)});
  filter: ${({ $active }) =>
    $active ? 'drop-shadow(0 16px 18px rgba(25, 44, 34, 0.34))' : 'drop-shadow(0 7px 7px rgba(25, 44, 34, 0.14))'};
  transition: transform 170ms ease-out, filter 170ms ease-out;
`

const RoseIdle = styled.div`
  animation: ${roseIdle} var(--idle-duration) var(--idle-delay) ease-in-out infinite;
  will-change: transform;
`

const RoseTurn = styled.div`
  transform: rotate(var(--rose-rotation));
  transform-origin: 50% 24%;
  transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
`

const RoseBloom = styled.div<{ $blooming: boolean }>`
  transform-origin: 50% 24%;
  ${({ $blooming }) =>
    $blooming &&
    css`
      animation: ${bloom} 460ms cubic-bezier(0.2, 0.8, 0.2, 1);
    `}
`

const RoseImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  object-fit: contain;
`

const Instructions = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`

export default RoseBouquet
