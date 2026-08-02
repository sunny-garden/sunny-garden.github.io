export interface Point {
  x: number
  y: number
}

export interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface Viewport {
  width: number
  height: number
  insetTop?: number
  insetRight?: number
  insetBottom?: number
  insetLeft?: number
}

export interface TimedPoint {
  time: number
  point: Point
}

export interface Matrix2D {
  a: number
  b: number
  c: number
  d: number
}

export interface RoseSlot {
  id: string
  color: 'red' | 'blue'
  x: number
  y: number
  widthPercent: number
  rotation: number
  zIndex: number
  idleDuration: number
  idleDelay: number
  float: number
  sway: number
  breathe: number
}

export const ROSE_SLOTS: readonly RoseSlot[] = [
  {
    id: 'rear-left',
    color: 'red',
    x: 0.23,
    y: 0.16,
    widthPercent: 48,
    rotation: -11,
    zIndex: 31,
    idleDuration: 6.8,
    idleDelay: -1.3,
    float: 4,
    sway: 1.4,
    breathe: 1.018,
  },
  {
    id: 'rear-center-left',
    color: 'blue',
    x: 0.4,
    y: 0.12,
    widthPercent: 46,
    rotation: -4,
    zIndex: 32,
    idleDuration: 7.4,
    idleDelay: -3.1,
    float: 5,
    sway: 1.1,
    breathe: 1.014,
  },
  {
    id: 'rear-center-right',
    color: 'red',
    x: 0.57,
    y: 0.13,
    widthPercent: 47,
    rotation: 5,
    zIndex: 33,
    idleDuration: 6.3,
    idleDelay: -2.2,
    float: 3,
    sway: 1.7,
    breathe: 1.021,
  },
  {
    id: 'rear-right',
    color: 'blue',
    x: 0.74,
    y: 0.18,
    widthPercent: 46,
    rotation: 12,
    zIndex: 34,
    idleDuration: 7.9,
    idleDelay: -4.4,
    float: 4.5,
    sway: 1.3,
    breathe: 1.016,
  },
  {
    id: 'middle-left',
    color: 'blue',
    x: 0.18,
    y: 0.3,
    widthPercent: 52,
    rotation: -14,
    zIndex: 41,
    idleDuration: 6.6,
    idleDelay: -3.7,
    float: 3.5,
    sway: 1.9,
    breathe: 1.02,
  },
  {
    id: 'middle-center-left',
    color: 'red',
    x: 0.38,
    y: 0.27,
    widthPercent: 54,
    rotation: -5,
    zIndex: 42,
    idleDuration: 7.1,
    idleDelay: -0.8,
    float: 5.5,
    sway: 1.2,
    breathe: 1.023,
  },
  {
    id: 'middle-center-right',
    color: 'blue',
    x: 0.59,
    y: 0.28,
    widthPercent: 53,
    rotation: 6,
    zIndex: 43,
    idleDuration: 6.1,
    idleDelay: -2.8,
    float: 4.2,
    sway: 1.6,
    breathe: 1.019,
  },
  {
    id: 'middle-right',
    color: 'red',
    x: 0.79,
    y: 0.32,
    widthPercent: 51,
    rotation: 15,
    zIndex: 44,
    idleDuration: 7.7,
    idleDelay: -5.2,
    float: 3.8,
    sway: 2,
    breathe: 1.015,
  },
  {
    id: 'front-center',
    color: 'red',
    x: 0.5,
    y: 0.4,
    widthPercent: 58,
    rotation: 1,
    zIndex: 51,
    idleDuration: 6.9,
    idleDelay: -4.8,
    float: 4.8,
    sway: 1,
    breathe: 1.025,
  },
]

export const clampScreenDelta = (
  bounds: Bounds,
  delta: Point,
  viewport: Viewport,
): Point => {
  const minX = (viewport.insetLeft ?? 0) - bounds.left
  const maxX = viewport.width - (viewport.insetRight ?? 0) - bounds.right
  const minY = (viewport.insetTop ?? 0) - bounds.top
  const maxY = viewport.height - (viewport.insetBottom ?? 0) - bounds.bottom

  return {
    x: Math.min(maxX, Math.max(minX, delta.x)),
    y: Math.min(maxY, Math.max(minY, delta.y)),
  }
}

export const isPointInBouquetOpening = (point: Point, bounds: Bounds): boolean => {
  const width = bounds.right - bounds.left
  const height = bounds.bottom - bounds.top
  const normalizedX = (point.x - bounds.left) / width
  const normalizedY = (point.y - bounds.top) / height

  return normalizedX >= 0.12 && normalizedX <= 0.88 && normalizedY >= 0.05 && normalizedY <= 0.48
}

export const getSlotPoint = (slot: RoseSlot, bounds: Bounds): Point => ({
  x: bounds.left + (bounds.right - bounds.left) * slot.x,
  y: bounds.top + (bounds.bottom - bounds.top) * slot.y,
})

export const findClosestAvailableSlot = (
  point: Point,
  wrapperBounds: Bounds,
  occupiedSlotIds: ReadonlySet<string>,
): RoseSlot | null => {
  if (!isPointInBouquetOpening(point, wrapperBounds)) return null

  let closest: RoseSlot | null = null
  let closestDistance = Number.POSITIVE_INFINITY

  for (const slot of ROSE_SLOTS) {
    if (occupiedSlotIds.has(slot.id)) continue
    const slotPoint = getSlotPoint(slot, wrapperBounds)
    const distance = (point.x - slotPoint.x) ** 2 + (point.y - slotPoint.y) ** 2
    if (distance < closestDistance) {
      closest = slot
      closestDistance = distance
    }
  }

  return closest
}

export const getRotationVariation = (currentStep: number, roseIndex: number): number => {
  const magnitude = 4 + (Math.floor((currentStep + roseIndex) / 2) % 3)
  return (currentStep + roseIndex) % 2 === 0 ? -magnitude : magnitude
}

export const screenVectorToLocal = (vector: Point, matrix: Matrix2D): Point => {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c
  if (Math.abs(determinant) < Number.EPSILON) return vector

  return {
    x: (matrix.d * vector.x - matrix.c * vector.y) / determinant,
    y: (-matrix.b * vector.x + matrix.a * vector.y) / determinant,
  }
}

export const localVectorToScreen = (vector: Point, matrix: Matrix2D): Point => ({
  x: matrix.a * vector.x + matrix.c * vector.y,
  y: matrix.b * vector.x + matrix.d * vector.y,
})

export const hasDragStarted = (delta: Point, threshold = 7): boolean =>
  Math.hypot(delta.x, delta.y) >= threshold

export const isDoubleTap = (previous: TimedPoint | undefined, current: TimedPoint): boolean =>
  previous !== undefined &&
  current.time - previous.time <= 320 &&
  Math.hypot(current.point.x - previous.point.x, current.point.y - previous.point.y) <= 24
