import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import {
  clampScreenDelta,
  hasDragStarted,
  screenVectorToLocal,
  type Bounds,
  type Matrix2D,
  type Point,
  type Viewport,
} from './bouquet2d'

export interface DragEndDetail {
  id: string
  translation: Point
  clientPoint: Point
  bounds: Bounds
  cancelled: boolean
  moved: boolean
}

interface UseDraggableBouquetLayerOptions {
  id: string
  disabled: boolean
  translation: Point
  coordinateRootRef: RefObject<HTMLElement | null>
  elementRef: RefObject<HTMLDivElement | null>
  onDragStart: (id: string) => void
  onDragEnd: (detail: DragEndDetail) => void
  onTap?: (id: string, point: Point) => void
}

interface ActivePointer {
  pointerId: number
  startPoint: Point
  startTranslation: Point
  startBounds: Bounds
  parentMatrix: Matrix2D
  latestTranslation: Point
  moved: boolean
}

let scrollLockCount = 0
let previousBodyOverflow = ''
let previousOverscrollBehavior = ''

const lockPageScroll = () => {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    previousOverscrollBehavior = document.documentElement.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
  }
  scrollLockCount += 1
}

const unlockPageScroll = () => {
  scrollLockCount = Math.max(0, scrollLockCount - 1)
  if (scrollLockCount !== 0) return
  document.body.style.overflow = previousBodyOverflow
  document.documentElement.style.overscrollBehavior = previousOverscrollBehavior
}

const rectToBounds = (rect: DOMRect): Bounds => ({
  left: rect.left,
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
})

const parseCssPixels = (value: string): number => Number.parseFloat(value) || 0

export const readSafeViewport = (): Viewport => {
  const styles = getComputedStyle(document.documentElement)
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    insetTop: parseCssPixels(styles.getPropertyValue('--safe-area-inset-top')),
    insetRight: parseCssPixels(styles.getPropertyValue('--safe-area-inset-right')),
    insetBottom: parseCssPixels(styles.getPropertyValue('--safe-area-inset-bottom')),
    insetLeft: parseCssPixels(styles.getPropertyValue('--safe-area-inset-left')),
  }
}

const getParentMatrix = (coordinateRoot: HTMLElement | null): Matrix2D => {
  const transformedParent = coordinateRoot?.parentElement
  if (!transformedParent) return { a: 1, b: 0, c: 0, d: 1 }
  const transform = getComputedStyle(transformedParent).transform
  if (!transform || transform === 'none') return { a: 1, b: 0, c: 0, d: 1 }

  const matrix = new DOMMatrixReadOnly(transform)
  return { a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d }
}

export const useDraggableBouquetLayer = ({
  id,
  disabled,
  translation,
  coordinateRootRef,
  elementRef,
  onDragStart,
  onDragEnd,
  onTap,
}: UseDraggableBouquetLayerOptions) => {
  const activePointerRef = useRef<ActivePointer | null>(null)
  const animationFrameRef = useRef(0)
  const scrollLockedRef = useRef(false)

  const writeTranslation = (nextTranslation: Point) => {
    const element = elementRef.current
    if (!element) return
    element.style.setProperty('--drag-x', `${nextTranslation.x}px`)
    element.style.setProperty('--drag-y', `${nextTranslation.y}px`)
  }

  const flushPendingFrame = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = 0
    const activePointer = activePointerRef.current
    if (activePointer) writeTranslation(activePointer.latestTranslation)
  }

  const restoreScroll = () => {
    if (!scrollLockedRef.current) return
    scrollLockedRef.current = false
    unlockPageScroll()
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    element.style.setProperty('--drag-x', `${translation.x}px`)
    element.style.setProperty('--drag-y', `${translation.y}px`)
  }, [elementRef, translation])

  useEffect(
    () => () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = 0
      const activePointer = activePointerRef.current
      const element = elementRef.current
      if (activePointer && element?.hasPointerCapture(activePointer.pointerId)) {
        element.releasePointerCapture(activePointer.pointerId)
      }
      activePointerRef.current = null
      if (scrollLockedRef.current) {
        scrollLockedRef.current = false
        unlockPageScroll()
      }
    },
    [elementRef],
  )

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerRef.current) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const element = elementRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    const startTranslation = translation
    activePointerRef.current = {
      pointerId: event.pointerId,
      startPoint: { x: event.clientX, y: event.clientY },
      startTranslation,
      startBounds: rectToBounds(rect),
      parentMatrix: getParentMatrix(coordinateRootRef.current),
      latestTranslation: startTranslation,
      moved: false,
    }
    element.setPointerCapture(event.pointerId)
    lockPageScroll()
    scrollLockedRef.current = true
    onDragStart(id)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const activePointer = activePointerRef.current
    if (!activePointer || activePointer.pointerId !== event.pointerId) return
    event.preventDefault()

    const rawScreenDelta = {
      x: event.clientX - activePointer.startPoint.x,
      y: event.clientY - activePointer.startPoint.y,
    }
    const screenDelta = clampScreenDelta(
      activePointer.startBounds,
      rawScreenDelta,
      readSafeViewport(),
    )
    const localDelta = screenVectorToLocal(screenDelta, activePointer.parentMatrix)
    activePointer.latestTranslation = {
      x: activePointer.startTranslation.x + localDelta.x,
      y: activePointer.startTranslation.y + localDelta.y,
    }
    activePointer.moved ||= hasDragStarted(rawScreenDelta)

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = 0
        const currentPointer = activePointerRef.current
        if (currentPointer) writeTranslation(currentPointer.latestTranslation)
      })
    }
  }

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const activePointer = activePointerRef.current
    if (!activePointer || activePointer.pointerId !== event.pointerId) return
    flushPendingFrame()

    if (!activePointer.moved) {
      activePointer.latestTranslation = activePointer.startTranslation
      writeTranslation(activePointer.startTranslation)
    }

    const element = elementRef.current
    const bounds = element
      ? rectToBounds(element.getBoundingClientRect())
      : activePointer.startBounds
    if (element?.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    activePointerRef.current = null
    restoreScroll()

    const clientPoint = { x: event.clientX, y: event.clientY }
    if (!cancelled && !activePointer.moved) onTap?.(id, clientPoint)
    onDragEnd({
      id,
      translation: activePointer.latestTranslation,
      clientPoint,
      bounds,
      cancelled,
      moved: activePointer.moved,
    })
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => finishPointer(event, false),
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => finishPointer(event, true),
  }
}
