import type { LyricLine } from '../types/proposal'

const base = import.meta.env.BASE_URL

/**
 * Absolute, GitHub-Pages-safe URLs for every audio asset. Every path is built
 * from `import.meta.env.BASE_URL`, so the files resolve correctly whether the
 * site is served from the domain root or from a `/repo-name/` sub-path.
 *
 * Drop the matching files into `public/audio/` and they will be picked up.
 */
export const audioPaths = {
  /** Voiceover for the intro. */
  intro: `${base}audio/megatron-vo.mp3`,
  /** Funny / dramatic sound when the NO button runs away. */
  sfxNo: `${base}audio/sfx-no.mp3`,
  /** Happy sound when YES is pressed. */
  sfxYes: `${base}audio/sfx-yes.mp3`,
  /** Looping ambient background music (muted by default). */
  bgMusic: `${base}audio/bg-music.mp3`,
} as const

/**
 * Placeholder, royalty-free lyric lines written for this project. Replace the
 * `text` / `delay` pairs with your own lyric timings — the intro syncs each
 * line to its `delay` (in seconds) automatically.
 */
export const introLyrics: LyricLine[] = [
  { text: 'On a rooftop of moonlight and rust,', delay: 0.8 },
  { text: 'a little steel cat powers on...', delay: 3.6 },
  { text: 'He knocked the vase. He hid the keys.', delay: 6.4 },
  { text: 'He shredded the morning news.', delay: 9.2 },
  { text: 'But every night he finds his way home,', delay: 12.0 },
  { text: 'with a tiny, sorry spark.', delay: 14.8 },
  { text: 'So before the screen fades to black...', delay: 17.6 },
  { text: 'he has one question for you.', delay: 20.2 },
]

/** Escalating, increasingly desperate labels for the evasive NO button. */
export const noButtonLabels: string[] = [
  'No',
  'Are you sure?',
  'Really sure?',
  'Think it over...',
  'Have a heart!',
  'I brought tuna.',
  'Look at these eyes...',
  'You can pet me!',
  'Pretty please?',
  'My paws are shaking.',
  'You cannot resist.',
  'Last whisker chance!',
]

export const proposalCopy = {
  kicker: 'A Tiny Apology',
  title: 'Will you fur-give me?',
  subtitle: 'I knocked a few things over. I meant well. Mostly.',
  yesLabel: 'Yes, of course',
  celebrationKicker: 'Purr-fect',
  celebrationTitle: 'Meow! I knew it.',
  celebrationMessage:
    'Forgiven, forever and a whisker. Come on — let us go knock something off a shelf together.',
} as const
