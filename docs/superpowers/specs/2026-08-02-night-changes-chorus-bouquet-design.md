# Night Changes Chorus → Bouquet Reveal Design

## Goal

Pressing the existing "Uhm" button on the home page starts a pre-cut 40.21-second chorus clip of One Direction's "Night Changes". A lyric-video overlay shows the cleaned chorus lines synced to the audio's playback clock, and when the clip ends the existing interactive 2D bouquet presentation runs automatically.

## Chosen Approach

Use the audio element's `currentTime` as the synchronization clock via a `requestAnimationFrame` polling loop, instead of wall-clock timers. Lines advance as `currentTime` crosses each line's `delay`. This stays aligned even when loading or playback starts slowly, and avoids drift during stalls.

The existing `LyricOverlay` is extended with an optional `currentTime` callback. When provided, it runs in audio-clock mode; without it, it keeps its current timer-based behavior for the proposal intro. This reuses the existing lyric styling, cross-fade animation, `aria-live` handling, and the `LyricLine` data shape.

## Sequence

1. Home page starts in `idle`. The "Uhm" button is the existing `GiveButton`.
2. On press: `stage` becomes `playing`, the cut MP3 starts from `0`.
3. A twilight backdrop plus `LyricOverlay` (audio-clock mode) mount over the garden.
4. Nine cleaned lines appear at their relative timestamps; interjections are omitted, and the user's contractions are preserved verbatim.
5. On the audio `ended` event, `stage` becomes `presented`, the overlay unmounts, and `RoseBouquet` runs its existing reveal animation (`presented={true}`).
6. If playback fails (missing asset, autoplay rejection, decode error), the stage returns to `idle`, the button is restored, and a status announcement is made.

## Lyric Timings (seconds from clip start)

| # | Line | Start |
|---|------|-------|
| 1 | We're only gettin' older, baby | 0.24 |
| 2 | And I've been thinkin' about it lately | 4.48 |
| 3 | Does it ever drive you crazy | 8.84 |
| 4 | Just how fast the night changes? | 12.19 |
| 5 | Everything that you've ever dreamed of | 16.72 |
| 6 | Disappearin' when you wake up | 20.64 |
| 7 | But there's nothin' to be afraid of | 24.68 |
| 8 | Even when the night changes | 28.05 |
| 9 | It will never change me and you | 32.73 |

Timestamps are derived from the LRCLIB consensus map (ID 37104558, 240 s) shifted by the first chorus start (`40.24s`), matching the user's 40.21 s cut.

## Files

- `src/data/songLyrics.ts` — lyric lines plus the pure `getActiveLyricIndex(lines, time)` helper.
- `src/data/songLyrics.test.ts` — Vitest coverage for the boundary helper.
- `src/components/proposal/LyricOverlay.tsx` — optional `currentTime` prop for audio-clock mode.
- `src/data/proposalContent.ts` — add `nightChanges` to `audioPaths`.
- `src/pages/HomePage.tsx` — `idle | playing | presented` stages, audio element, overlay mount, reveal trigger, error recovery.
- `public/audio/night-changes-song.mp3` — the user's already-cut clip (copied from `audio/night-changes-song.mp3`).
- `public/audio/README.md` — document the new asset.

## Constraints

- No new dependencies. No audio editing in the repo — the clip is the user's cut.
- Reuse `RoseBouquet`, `LyricOverlay`, and the existing `GiveButton` presentation.
- Respect `prefers-reduced-motion` via existing global CSS and `useReducedMotion` usage.
- Missing audio never crashes the page; failure restores the idle state.
