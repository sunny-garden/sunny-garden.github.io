import { describe, expect, it } from 'vitest'
import {
  ROSE_SLOTS,
  clampScreenDelta,
  findClosestAvailableSlot,
  getRotationVariation,
  getSlotPoint,
  hasDragStarted,
  isDoubleTap,
  isPointInBouquetOpening,
  localVectorToScreen,
  screenVectorToLocal,
} from './bouquet2d'

const wrapperBounds = { left: 50, top: 50, right: 250, bottom: 350 }

describe('2D bouquet arrangement', () => {
  it('defines nine slots with five red and four blue roses', () => {
    expect(ROSE_SLOTS).toHaveLength(9)
    expect(ROSE_SLOTS.filter((slot) => slot.color === 'red')).toHaveLength(5)
    expect(ROSE_SLOTS.filter((slot) => slot.color === 'blue')).toHaveLength(4)
    expect(new Set(ROSE_SLOTS.map((slot) => slot.id)).size).toBe(9)
  })

  it('gives every rose distinct idle animation settings', () => {
    const signatures = ROSE_SLOTS.map((slot) =>
      [slot.idleDuration, slot.idleDelay, slot.float, slot.sway, slot.breathe].join(':'),
    )

    expect(new Set(signatures).size).toBe(ROSE_SLOTS.length)
  })
})

describe('clampScreenDelta', () => {
  it('clamps movement at every viewport edge', () => {
    const bounds = { left: 20, top: 30, right: 120, bottom: 230 }
    const viewport = { width: 390, height: 844 }

    expect(clampScreenDelta(bounds, { x: -50, y: 700 }, viewport)).toEqual({
      x: -20,
      y: 614,
    })
    expect(clampScreenDelta(bounds, { x: 500, y: -80 }, viewport)).toEqual({
      x: 270,
      y: -30,
    })
  })

  it('preserves movement that remains within the viewport', () => {
    expect(
      clampScreenDelta(
        { left: 20, top: 30, right: 120, bottom: 230 },
        { x: 40, y: 50 },
        { width: 390, height: 844 },
      ),
    ).toEqual({ x: 40, y: 50 })
  })

  it('keeps item bounds inside viewport safe-area insets', () => {
    const bounds = { left: 10, top: 10, right: 110, bottom: 110 }
    const viewport = {
      width: 200,
      height: 200,
      insetTop: 30,
      insetRight: 40,
      insetBottom: 50,
      insetLeft: 20,
    }

    expect(clampScreenDelta(bounds, { x: -50, y: -50 }, viewport)).toEqual({ x: 10, y: 20 })
    expect(clampScreenDelta(bounds, { x: 100, y: 100 }, viewport)).toEqual({ x: 50, y: 40 })
  })
})

describe('bouquet opening and slots', () => {
  it('accepts points inside the upper opening and rejects points outside it', () => {
    expect(isPointInBouquetOpening({ x: 150, y: 120 }, wrapperBounds)).toBe(true)
    expect(isPointInBouquetOpening({ x: 60, y: 120 }, wrapperBounds)).toBe(false)
    expect(isPointInBouquetOpening({ x: 150, y: 260 }, wrapperBounds)).toBe(false)
  })

  it('maps normalized slot coordinates into wrapper coordinates', () => {
    expect(
      getSlotPoint(
        {
          ...ROSE_SLOTS[0],
          x: 0.25,
          y: 0.2,
        },
        wrapperBounds,
      ),
    ).toEqual({ x: 100, y: 110 })
  })

  it('selects the nearest available slot and skips occupied slots', () => {
    const nearest = findClosestAvailableSlot({ x: 150, y: 100 }, wrapperBounds, new Set())
    expect(nearest).not.toBeNull()

    const nextNearest = findClosestAvailableSlot(
      { x: 150, y: 100 },
      wrapperBounds,
      new Set([nearest!.id]),
    )

    expect(nextNearest).not.toBeNull()
    expect(nextNearest!.id).not.toBe(nearest!.id)
  })

  it('returns no slot outside the opening or when every slot is occupied', () => {
    expect(findClosestAvailableSlot({ x: 20, y: 20 }, wrapperBounds, new Set())).toBeNull()
    expect(
      findClosestAvailableSlot(
        { x: 150, y: 100 },
        wrapperBounds,
        new Set(ROSE_SLOTS.map((slot) => slot.id)),
      ),
    ).toBeNull()
  })
})

describe('getRotationVariation', () => {
  it('alternates a small deterministic rotation by rose and tap step', () => {
    expect(getRotationVariation(0, 0)).toBe(-4)
    expect(getRotationVariation(0, 1)).toBe(4)
    expect(getRotationVariation(1, 0)).toBe(4)
    expect(Math.abs(getRotationVariation(8, 7))).toBeLessThanOrEqual(6)
  })
})

describe('screenVectorToLocal', () => {
  it('preserves vectors for an identity transform', () => {
    expect(screenVectorToLocal({ x: 14, y: -8 }, { a: 1, b: 0, c: 0, d: 1 })).toEqual({
      x: 14,
      y: -8,
    })
  })

  it('inverts a rotated parent coordinate system', () => {
    const local = screenVectorToLocal({ x: 0, y: 20 }, { a: 0, b: 1, c: -1, d: 0 })

    expect(local.x).toBeCloseTo(20)
    expect(local.y).toBeCloseTo(0)
  })

  it('falls back to the screen vector for a singular matrix', () => {
    expect(screenVectorToLocal({ x: 3, y: 5 }, { a: 0, b: 0, c: 0, d: 0 })).toEqual({
      x: 3,
      y: 5,
    })
  })
})

describe('localVectorToScreen', () => {
  it('applies the parent transform without translation', () => {
    expect(localVectorToScreen({ x: 12, y: -4 }, { a: 1, b: 0, c: 0, d: 1 })).toEqual({
      x: 12,
      y: -4,
    })
    expect(localVectorToScreen({ x: 20, y: 0 }, { a: 0, b: 1, c: -1, d: 0 })).toEqual({
      x: 0,
      y: 20,
    })
  })
})

describe('pointer gesture classification', () => {
  it('starts a drag only at the movement threshold', () => {
    expect(hasDragStarted({ x: 3, y: 4 })).toBe(false)
    expect(hasDragStarted({ x: 7, y: 0 })).toBe(true)
  })

  it('recognizes a nearby second tap within the double-tap interval', () => {
    expect(
      isDoubleTap(
        { time: 1_000, point: { x: 40, y: 50 } },
        { time: 1_300, point: { x: 58, y: 62 } },
      ),
    ).toBe(true)
    expect(
      isDoubleTap(
        { time: 1_000, point: { x: 40, y: 50 } },
        { time: 1_321, point: { x: 40, y: 50 } },
      ),
    ).toBe(false)
    expect(
      isDoubleTap(
        { time: 1_000, point: { x: 40, y: 50 } },
        { time: 1_200, point: { x: 65, y: 50 } },
      ),
    ).toBe(false)
  })
})
