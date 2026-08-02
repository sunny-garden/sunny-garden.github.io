export interface LyricLine {
  /** The line of text shown on screen. */
  text: string
  /** Seconds from the start of the intro when this line should appear. */
  delay: number
}

export type SfxName = 'no' | 'yes'

export interface SfxContextValue {
  /** Play a one-shot UI sound effect. Never throws if the file is missing. */
  playSfx: (name: SfxName) => void
}

export type CatMood = 'neutral' | 'plead' | 'happy'
