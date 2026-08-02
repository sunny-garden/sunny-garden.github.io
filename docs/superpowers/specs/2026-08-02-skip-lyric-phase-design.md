# Skip Button for the Song Lyric Phase

## Goal

Add a small skip button to the song lyric phase on the home page
(`HomePage.tsx`). During `stage === 'playing'`, the lyric overlay plays while
the song runs. The button lives at the bottom-right corner and lets the user
jump straight to the presented state.

## Behavior

- The button only renders while `stage === 'playing'`.
- Clicking it:
  1. Pauses the song (`songRef`).
  2. Starts the looping background music (`bgMusicRef`) at
     `BG_MUSIC_VOLUME` (set directly; `prefers-reduced-motion` users get the
     same behavior, consistent with the existing crossfade logic).
  3. Sets stage to `presented`, triggering the bouquet handoff and letter
     reveal, exactly as if the song had ended.

## Placement and Styling

- Rendered inside `SongOverlay`, which has `pointer-events: none`, so the
  button itself needs `pointer-events: auto`.
- Positioned `bottom` + `right` with safe-area insets, styled as a small
  semi-transparent dark pill: subtle border, `backdrop-filter: blur`, small
  text, hover/tap feedback, and `touch-action: manipulation` — mirroring the
  existing `SkipButton` in `Intro.tsx` but smaller and corner-anchored.

## Files

- `src/pages/HomePage.tsx` — add `handleSkip` callback and the styled
  `SkipButton`; no other files change.
