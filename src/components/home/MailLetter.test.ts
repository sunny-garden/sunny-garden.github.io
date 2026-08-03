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

  it('uses a larger mobile paper and keeps text inside the readable paper center', () => {
    expect(source).toContain('width: min(145vw, 680px);')
    expect(source).toContain('height: min(96svh, 900px);')
    expect(source).toContain('transform: scaleX(1.16);')
    expect(source).toContain('inset: 10% 17% 12%;')
    expect(source).toContain('font-size: clamp(0.78rem, 3.15vw, 0.92rem);')
    expect(source).toContain('position: fixed;')
    expect(source).toContain('top: max(12px, calc(env(safe-area-inset-top) + 8px));')
    expect(source).toContain('right: max(12px, calc(env(safe-area-inset-right) + 8px));')
    expect(source).toContain('width: 22px;')
    expect(source).toContain('height: 22px;')
    expect(source).toContain('font-size: 0.68rem;')
    expect(source).toContain('box-shadow: none;')
    expect(source).toContain('filter: none;')
    expect(source).toContain('outline: 0;')
  })

  it('uses a larger mobile letter icon button', () => {
    expect(source).toContain('width: clamp(118px, 32vw, 150px);')
  })

  it('plays generated sounds for opening, revealing, and closing the letter', () => {
    expect(source).toContain("import { playUiSound } from '../../services/soundEffects'")
    expect(source).toContain("playUiSound('select')")
    expect(source).toContain("playUiSound('transition')")
    expect(source).toContain("playUiSound('click')")
  })

  it('captures location once before revealing the paper', () => {
    expect(source).toContain("import { captureLetterLocation } from '../../services/locationCapture'")
    expect(source).toContain('const locationRequestRef = useRef<Promise<unknown> | null>(null)')
    expect(source).toContain('const revealPendingRef = useRef(false)')
  })

  it('includes a secret message stage in the mail stage type', () => {
    expect(source).toContain("type MailStage = 'closed' | 'opened' | 'letter' | 'message'")
  })

  it('imports the secret message button image', () => {
    expect(source).toContain("import secretMessageButtonUrl from '../../../images/secret-message-button.png'")
  })

  it('imports the SecretMessageForm component', () => {
    expect(source).toContain("import SecretMessageForm from './SecretMessageForm'")
  })

  it('renders a message button after the paper body', () => {
    const paperBodyEnd = source.indexOf('</PaperBody>')
    const messageButtonIdx = source.indexOf('MessageButtonWrapper', paperBodyEnd)
    expect(paperBodyEnd).toBeGreaterThan(-1)
    expect(messageButtonIdx).toBeGreaterThan(paperBodyEnd)
  })

  it('uses the message button image with proper dimensions', () => {
    expect(source).toContain('width="1536"')
    expect(source).toContain('height="1024"')
    expect(source).toContain('secret-message-button.png')
  })

  it('has animated hover, tap, and float for the message button', () => {
    expect(source).toContain('whileHover')
    expect(source).toContain('whileTap')
    expect(source).toContain('MessageButtonWrapper')
  })

  it('transitions to the message form on button click', () => {
    expect(source).toContain("setStage('message')")
    expect(source).toContain('openMessageForm')
  })

  it('closes the message form and returns focus to the button', () => {
    expect(source).toContain("messageButtonRef.current?.focus()")
    expect(source).toContain('closeMessageForm')
  })

  it('handles escape key for both letter and message overlays', () => {
    expect(source).toContain("stage !== 'letter' && stage !== 'message'")
    expect(source).toContain("stage === 'message'")
    expect(source).toContain('closeMessageForm()')
  })
})
