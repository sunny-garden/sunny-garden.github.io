# Night Changes Chorus → Bouquet Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pressing "Uhm" on the home page plays a 40.21 s chorus clip with audio-synced lyric overlays, then automatically reveals the interactive bouquet.

**Architecture:** Home page gets an `idle | playing | presented` stage machine. Audio-clock lyric sync polls `HTMLAudioElement.currentTime` via `requestAnimationFrame` and maps it to a lyric index with the pure helper `getActiveLyricIndex`. The existing `LyricOverlay` gains an optional clock mode; `RoseBouquet` reveal is reused unchanged.

**Tech Stack:** React 19, TypeScript, framer-motion, styled-components, Vitest.

## Global Constraints

- No new dependencies. No audio cutting/editing — the clip `audio/night-changes-song.mp3` is the user's cut and is served from `public/audio/`.
- User's lyric text must keep exact contractions: "gettin'", "thinkin'", "Disappearin'", "nothin'". Interjections (Ooh/Ah) are omitted.
- Reuse existing components: `RoseBouquet`, `LyricOverlay`, `GiveButton` styles in `HomePage`.
- Missing/failed audio must never crash: revert to `idle`, restore the button, announce via the existing `role="status"` region.
- Existing `LyricOverlay` timer mode (proposal intro) must remain unchanged in behavior.

---

### Task 1: Lyric data and clock-boundary helper (TDD)

**Files:**
- Create: `src/data/songLyrics.ts`
- Create: `src/data/songLyrics.test.ts`

**Interfaces:**
- Produces: `export interface LyricLine` re-exported from `../types/proposal` (already exists); `export const songLyrics: LyricLine[]`; `export const getActiveLyricIndex = (lines: LyricLine[], time: number): number` — returns the index of the latest line whose `delay <= time`, or `-1` before the first line. Lines are sorted by `delay`.

- [ ] **Step 1: Write the failing test**

Create `src/data/songLyrics.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/songLyrics.test.ts`
Expected: FAIL — module `./songLyrics` not found.

- [ ] **Step 3: Write the implementation**

Create `src/data/songLyrics.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/songLyrics.test.ts`
Expected: PASS (2 suites, 6 tests).

- [ ] **Step 5: Commit** (only if the user asks; otherwise skip and continue)

```bash
git add src/data/songLyrics.ts src/data/songLyrics.test.ts
git commit -m "feat: add chorus lyric data and audio-clock index helper"
```

---

### Task 2: Audio-clock mode for LyricOverlay

**Files:**
- Modify: `src/components/proposal/LyricOverlay.tsx`

**Interfaces:**
- Consumes: `getActiveLyricIndex` from `../data/songLyrics` (Task 1).
- Produces: `LyricOverlay({ lines, currentTime?, onComplete? })` — when `currentTime` is provided, lines advance by polling that clock; otherwise the existing timer behavior runs. `onComplete` stays timer-mode only.

- [ ] **Step 1: Update the component**

Change the props interface and the effect in `src/components/proposal/LyricOverlay.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styled from 'styled-components'
import { getActiveLyricIndex } from '../../data/songLyrics'
import type { LyricLine } from '../../types/proposal'

interface LyricOverlayProps {
  lines: LyricLine[]
  /**
   * Optional live audio clock in seconds. When provided, lines advance by
   * polling this clock instead of wall-clock timers, so they stay aligned
   * with playback. The value should be stable across renders (useCallback).
   */
  currentTime?: () => number
  /** Called once the final line has finished holding on screen (timer mode only). */
  onComplete?: () => void
}
```

Then replace the single `useEffect` with two effects — keep the existing timer effect verbatim for timer mode, and add:

```tsx
  useEffect(() => {
    if (!currentTime) {
      return
    }
    let frame = 0
    let last = -1
    const tick = () => {
      const next = getActiveLyricIndex(lines, currentTime())
      if (next !== last) {
        last = next
        setIndex(next)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [lines, currentTime])
```

`currentTime` may read `NaN` before metadata loads; `getActiveLyricIndex` treats `NaN >= x` as false, so no line shows until real audio time exists.

- [ ] **Step 2: Verify timer mode is unchanged**

Run: `npx vitest run` then `npm run lint`
Expected: PASS / no errors. The intro flow still uses `delay` timers because `Intro` does not pass `currentTime`.

---

### Task 3: Home page song → bouquet sequence

**Files:**
- Modify: `src/data/proposalContent.ts` (add `nightChanges` to `audioPaths`)
- Modify: `src/pages/HomePage.tsx`
- Modify: `public/audio/README.md`

**Interfaces:**
- Consumes: `songLyrics` from `../data/songLyrics`, `LyricOverlay`, `audioPaths` from `../data/proposalContent` (Task 2 / existing).
- Produces: home `idle | playing | presented` behavior; no API surface for other tasks.

- [ ] **Step 1: Register the audio path**

In `src/data/proposalContent.ts`, add inside `audioPaths`:

```ts
  /** Pre-cut chorus of "Night Changes" for the home bouquet reveal. */
  nightChanges: `${base}audio/night-changes-song.mp3`,
```

- [ ] **Step 2: Rewrite HomePage flow**

In `src/pages/HomePage.tsx`, replace the single `presented` state with a stage machine and wire the audio element:

```tsx
import { useCallback, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import RoseBouquet from '../components/home/RoseBouquet'
import LyricOverlay from '../components/proposal/LyricOverlay'
import { audioPaths } from '../data/proposalContent'
import { songLyrics } from '../data/songLyrics'

type Stage = 'idle' | 'playing' | 'presented'

const HomePage = () => {
  const [stage, setStage] = useState<Stage>('idle')
  const [playFailed, setPlayFailed] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const reduceMotion = useReducedMotion()
  const baseUrl = import.meta.env.BASE_URL

  const readAudioTime = useCallback(() => audioRef.current?.currentTime ?? 0, [])

  const startSong = useCallback(() => {
    setStage((current) => {
      if (current !== 'idle') {
        return current
      }
      setPlayFailed(false)
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = 0
        const playback = audio.play()
        if (playback) {
          playback.catch(() => {
            setPlayFailed(true)
            setStage('idle')
          })
        }
      }
      return 'playing'
    })
  }, [])

  const handleEnded = useCallback(() => setStage('presented'), [])

  const handleError = useCallback(() => {
    setPlayFailed(true)
    setStage('idle')
  }, [])

  const presented = stage === 'presented'

  return (
    <Page>
      <BackgroundImage
        src={`${baseUrl}background.webp`}
        alt=""
        width="1672"
        height="941"
        fetchPriority="high"
      />
      <Atmosphere aria-hidden="true" />
      <TextSpace aria-label="Space reserved for a personal message" />

      <CharacterFrame
        initial={false}
        animate={{
          x: presented && !reduceMotion ? [0, -8, 0] : 0,
          rotate: presented && !reduceMotion ? [0, -0.7, 0] : 0,
        }}
        transition={{ delay: 2.25, duration: 1.1, ease: 'easeInOut' }}
      >
        <CharacterImage
          src={`${baseUrl}female_character.webp`}
          alt="A woman receiving a bouquet in a sunny garden"
          width="864"
          height="1820"
        />
      </CharacterFrame>

      <BouquetStage
        initial={false}
        animate={{
          x: presented ? 'var(--bouquet-handoff-x)' : 0,
          y: presented ? 'clamp(-34px, -4vh, -14px)' : 'clamp(0px, 0vh, 0px)',
          rotate: presented ? 6 : -7,
        }}
        transition={{
          delay: reduceMotion ? 0 : 1.95,
          duration: reduceMotion ? 0.01 : 1.25,
          type: reduceMotion ? 'tween' : 'spring',
          stiffness: 74,
          damping: 15,
        }}
      >
        <RoseBouquet presented={presented} />
      </BouquetStage>

      {stage === 'playing' && (
        <SongOverlay>
          <Backdrop aria-hidden="true" />
          <LyricOverlay lines={songLyrics} currentTime={readAudioTime} />
        </SongOverlay>
      )}

      <audio
        ref={audioRef}
        src={audioPaths.nightChanges}
        preload="auto"
        onEnded={handleEnded}
        onError={handleError}
      />

      {stage !== 'playing' && (
        <GiveButton
          type="button"
          aria-disabled={presented}
          onClick={startSong}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.4, ease: 'easeOut' }}
          whileHover={presented || reduceMotion ? undefined : { y: -4, scale: 1.025 }}
          whileTap={presented || reduceMotion ? undefined : { scale: 0.97 }}
        >
          <ButtonRose aria-hidden="true">✦</ButtonRose>
          Uhm
        </GiveButton>
      )}
      <CompletionStatus id="flower-status" role="status" aria-live="polite" aria-atomic="true">
        {presented
          ? 'Bouquet presented.'
          : playFailed
            ? 'Could not play the song. Please try again.'
            : ''}
      </CompletionStatus>
    </Page>
  )
}
```

Keep every existing styled component (`Page` … `CompletionStatus`) unchanged, and add:

```tsx
const SongOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
`

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 60%, rgba(6, 18, 31, 0.28), rgba(6, 18, 31, 0.66));
`
```

`LyricOverlay` renders `pointer-events: none` internally, so the garden remains non-interactive during playback and the bouquet can still be revealed afterward.

- [ ] **Step 3: Document the asset**

Append a row to `public/audio/README.md`:

```md
| `night-changes-song.mp3` | "Night Changes" chorus for the home bouquet reveal | MP3, ~40 s chorus clip |
```

- [ ] **Step 4: Copy the cut clip into public assets**

Run: `cp "audio/night-changes-song.mp3" "public/audio/night-changes-song.mp3"`
Then verify with: `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "public/audio/night-changes-song.mp3"`
Expected: `40.210000`

---

### Task 4: Verification

- [ ] **Step 1: Run the test suite**

Run: `npm test`
Expected: all tests pass, including the new `songLyrics` suites.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: `tsc -b` succeeds and Vite emits `dist/` including `dist/audio/night-changes-song.mp3`.

- [ ] **Step 4: Manual browser smoke check**

Run: `npm run dev` and verify on desktop + narrow mobile:
- "Uhm" press starts the chorus and shows lyric lines at the right beats.
- Lyrics disappear and the bouquet presentation runs automatically after the song ends.
- If the network blocks the MP3, the button returns and the status announces the failure.
- The `/proposal` intro still uses its timer-based lyrics.
