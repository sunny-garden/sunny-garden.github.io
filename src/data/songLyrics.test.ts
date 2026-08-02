import { describe, expect, it } from 'vitest'
import { getActiveLyricIndex, songLyrics } from './songLyrics'

describe('getActiveLyricIndex', () => {
  const lines = [
    { text: 'first', delay: 1 },
    { text: 'second', delay: 3 },
    { text: 'third', delay: 5 },
  ]

  it('returns -1 before the first line starts', () => {
    expect(getActiveLyricIndex(lines, 0.99)).toBe(-1)
  })

  it('returns the active line at exact boundaries', () => {
    expect(getActiveLyricIndex(lines, 1)).toBe(0)
    expect(getActiveLyricIndex(lines, 3)).toBe(1)
    expect(getActiveLyricIndex(lines, 5)).toBe(2)
  })

  it('holds the latest line between and after boundaries', () => {
    expect(getActiveLyricIndex(lines, 4.5)).toBe(1)
    expect(getActiveLyricIndex(lines, 999)).toBe(2)
  })

  it('handles backward seeks by returning the earlier line', () => {
    expect(getActiveLyricIndex(lines, 2)).toBe(0)
  })

  it('treats NaN time as no active line', () => {
    expect(getActiveLyricIndex(lines, Number.NaN)).toBe(-1)
  })
})

describe('songLyrics', () => {
  it('has nine cleaned lines starting at the chorus onset', () => {
    expect(songLyrics).toHaveLength(9)
    expect(songLyrics[0].text).toBe("We're only gettin' older, baby")
    expect(songLyrics[0].delay).toBeCloseTo(0.24, 2)
  })

  it('is sorted by delay and contains the final line', () => {
    const delays = songLyrics.map((line) => line.delay)
    expect([...delays].sort((a, b) => a - b)).toEqual(delays)
    expect(songLyrics[songLyrics.length - 1].text).toBe('It will never change me and you')
  })
})
