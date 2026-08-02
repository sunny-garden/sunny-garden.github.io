import { describe, expect, it } from 'vitest'
import source from './RoseBouquet.tsx?raw'

describe('RoseBouquet UI sounds', () => {
  it('plays generated sounds for drag, drop, bloom, and rotation interactions', () => {
    expect(source).toContain("import { playUiSound } from '../../services/soundEffects'")
    expect(source).toContain("playUiSound('click')")
    expect(source).toContain("playUiSound(detail.moved ? 'save' : 'click')")
    expect(source).toContain("playUiSound(doubleTap ? 'transition' : 'select')")
  })
})
