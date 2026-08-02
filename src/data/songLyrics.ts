import type { LyricLine } from '../types/proposal'

/**
 * Cleaned chorus lines for the cut "Night Changes" clip, timed in seconds
 * from the start of the clip. Interjections are omitted; the singer's
 * contractions are preserved verbatim.
 */
export const songLyrics: LyricLine[] = [
  { text: "We're only gettin' older, baby", delay: 0.24 },
  { text: "And I've been thinkin' about it lately", delay: 4.48 },
  { text: 'Does it ever drive you crazy', delay: 8.84 },
  { text: 'Just how fast the night changes?', delay: 12.19 },
  { text: "Everything that you've ever dreamed of", delay: 16.72 },
  { text: "Disappearin' when you wake up", delay: 20.64 },
  { text: "But there's nothin' to be afraid of", delay: 24.68 },
  { text: 'Even when the night changes', delay: 28.05 },
  { text: 'It will never change me and you', delay: 32.73 },
]

/**
 * Index of the latest line whose `delay` has been reached at `time`
 * (seconds), or -1 before the first line. Lines must be sorted by delay.
 */
export const getActiveLyricIndex = (lines: LyricLine[], time: number): number => {
  let active = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (time >= lines[i].delay) {
      active = i
    } else {
      break
    }
  }
  return active
}
