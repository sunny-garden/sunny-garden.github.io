import { describe, expect, it } from 'vitest'
import source from './SecretMessageForm.tsx?raw'

describe('SecretMessageForm', () => {
  it('includes a message textarea with accessible label', () => {
    expect(source).toContain('aria-label="Your secret message"')
    expect(source).toContain('placeholder="Write your secret message here..."')
  })

  it('has a character counter with live status', () => {
    expect(source).toContain('aria-live="polite"')
    expect(source).toContain('id="char-count"')
    expect(source).toContain('role="status"')
    expect(source).toContain('MAX_LENGTH')
  })

  it('disables send for empty messages', () => {
    expect(source).toContain('const canSend = message.trim().length > 0 && !overLimit')
    expect(source).toContain('disabled={!canSend || stage === \'submitting\'}')
  })

  it('has submitting state that prevents duplicate sends', () => {
    expect(source).toContain("stage === 'submitting'")
  })

  it('shows an error message on failure', () => {
    expect(source).toContain("setStage('error')")
    expect(source).toContain('role="alert"')
    expect(source).toContain('Could not send your message')
  })

  it('clears error after a timeout', () => {
    expect(source).toContain('setTimeout(() => setStage(\'editing\'), 2500)')
  })

  it('shows a sent confirmation with thank-you content', () => {
    expect(source).toContain("stage === 'sent'")
    expect(source).toContain('Message Sent')
    expect(source).toContain('Your secret message has been delivered.')
  })

  it('uses the requested secret message title text', () => {
    expect(source).toContain('Secret Message! 🤫💙')
    expect(source).not.toContain('Secret Message! 🤫💙🤍')
  })

  it('has a Back button that calls onBack', () => {
    expect(source).toContain('onClick={onBack}')
    expect(source).toContain('BackButtonImage')
  })

  it('optimizes image buttons for mobile width', () => {
    expect(source).toContain('width: min(150%, 660px);')
    expect(source).toContain('width: min(180%, 680px);')
    expect(source).toContain('gap: 0;')
    expect(source).toContain('width: clamp(260px, 68vw, 430px);')
    expect(source).toContain('width: clamp(190px, 50vw, 310px);')
    expect(source).toContain('margin-left: clamp(-112px, -16vw, -56px);')
    expect(source).toContain('margin-left: clamp(-124px, -26vw, -72px);')
    expect(source).toContain('translate: clamp(28px, 5vw, 56px) 0;')
    expect(source).toContain('translate: clamp(34px, 9vw, 68px) 0;')
  })

  it('imports the paper background image', () => {
    expect(source).toContain('paper.png')
  })

  it('provides autofocus on the textarea', () => {
    expect(source).toContain('textareaRef.current?.focus()')
  })

  it('supports Ctrl+Enter to send', () => {
    expect(source).toContain('event.metaKey || event.ctrlKey')
    expect(source).toContain('void handleSend()')
  })

  it('uses the same paper scaling for mobile as the existing letter', () => {
    expect(source).toContain('transform: scaleX(1.16);')
    expect(source).toContain('inset: 10% 17% 12%;')
    expect(source).toContain('font-size: 16px;')
  })

  it('renders as a dialog for screen readers', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
  })
})
