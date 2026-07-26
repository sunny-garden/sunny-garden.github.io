# Audio assets

Drop your audio files into this folder. They are copied to the site root at
build time and referenced through `import.meta.env.BASE_URL`, so they work on
GitHub Pages from any base path.

| File               | Used for                                  | Suggested format                |
| ------------------ | ----------------------------------------- | ------------------------------- |
| `megatron-vo.mp3`  | Intro voiceover (Megatron-inspired)       | MP3, ~128 kbps, ~20–25 seconds  |
| `sfx-no.mp3`       | NO button runs away (funny / dramatic)    | MP3, short one-shot (<1s)       |
| `sfx-yes.mp3`      | YES button pressed (happy)                | MP3, short one-shot (<1.5s)     |
| `bg-music.mp3`     | Ambient loop (muted by default)           | MP3, seamless loop              |

All of these are optional. If a file is missing the app never crashes:

- Sound effects fall back to a synthesised tone.
- The voiceover and background music simply stay silent.

To change a filename or path, edit `audioPaths` in
`src/data/proposalContent.ts`.
