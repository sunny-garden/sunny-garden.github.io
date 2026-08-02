import { describe, expect, it } from 'vitest'
import source from './HomePage.tsx?raw'

describe('HomePage UI sounds', () => {
  it('plays generated sounds when starting and skipping the lyric phase', () => {
    expect(source).toContain("import { playUiSound } from '../services/soundEffects'")
    expect(source).toContain("playUiSound('transition')")
    expect(source).toContain("playUiSound('click')")
  })

  it('keeps background music below UI sounds so feedback remains audible', () => {
    expect(source).toContain('const BG_MUSIC_VOLUME = 0.32')
  })

  it('uses the start-button image instead of the text start button', () => {
    expect(source).toContain("import startButtonUrl from '../../images/start-button.png'")
    expect(source).toContain('<StartButtonImage')
    expect(source).not.toContain('Uhm')
    expect(source).not.toContain('<ButtonRose')
  })

  it('uses larger mobile start button and higher mobile bouquet placement', () => {
    expect(source).toContain('bottom: 16vh;')
    expect(source).toContain('bottom: 14vh;')
    expect(source).toContain('width: clamp(178px, 58vw, 240px);')
    expect(source).toContain('width: clamp(168px, 62vw, 220px);')
    expect(source).toContain('width: min(82vw, 390px);')
    expect(source).toContain('width: min(86vw, 350px);')
  })
})
