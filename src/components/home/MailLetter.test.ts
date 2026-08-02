import { describe, expect, it } from 'vitest'
import source from './MailLetter.tsx?raw'

describe('MailLetter layout contract', () => {
  it('keeps the fixed letter popup outside the animated icon wrapper', () => {
    const groupStart = source.indexOf('<MailGroup')
    const groupEnd = source.indexOf('</MailGroup>', groupStart)

    expect(groupStart).toBeGreaterThan(-1)
    expect(groupEnd).toBeGreaterThan(groupStart)

    const mailGroupMarkup = source.slice(groupStart, groupEnd)

    expect(mailGroupMarkup).not.toContain('<LetterLayer')
  })
})
