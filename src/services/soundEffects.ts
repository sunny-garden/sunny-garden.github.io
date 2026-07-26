export type UiSound = 'click' | 'select' | 'transition' | 'complete' | 'save' | 'error' | 'evade' | 'celebrate'

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext
  }

interface ToneStep {
  delay: number
  duration: number
  frequency: number
  gain: number
  type: OscillatorType
}

const soundMap: Record<UiSound, ToneStep[]> = {
  click: [{ delay: 0, duration: 0.055, frequency: 640, gain: 0.025, type: 'sine' }],
  select: [
    { delay: 0, duration: 0.06, frequency: 720, gain: 0.028, type: 'sine' },
    { delay: 0.045, duration: 0.08, frequency: 980, gain: 0.022, type: 'triangle' },
  ],
  transition: [{ delay: 0, duration: 0.085, frequency: 520, gain: 0.025, type: 'triangle' }],
  complete: [
    { delay: 0, duration: 0.09, frequency: 660, gain: 0.03, type: 'sine' },
    { delay: 0.075, duration: 0.11, frequency: 880, gain: 0.028, type: 'sine' },
    { delay: 0.16, duration: 0.14, frequency: 1175, gain: 0.024, type: 'triangle' },
  ],
  save: [
    { delay: 0, duration: 0.08, frequency: 590, gain: 0.024, type: 'sine' },
    { delay: 0.07, duration: 0.1, frequency: 790, gain: 0.022, type: 'triangle' },
  ],
  error: [{ delay: 0, duration: 0.12, frequency: 210, gain: 0.02, type: 'sine' }],
  evade: [
    { delay: 0, duration: 0.07, frequency: 400, gain: 0.03, type: 'square' },
    { delay: 0.06, duration: 0.1, frequency: 320, gain: 0.025, type: 'sawtooth' },
  ],
  celebrate: [
    { delay: 0, duration: 0.08, frequency: 880, gain: 0.025, type: 'sine' },
    { delay: 0.07, duration: 0.09, frequency: 1100, gain: 0.028, type: 'sine' },
    { delay: 0.15, duration: 0.14, frequency: 1320, gain: 0.024, type: 'triangle' },
  ],
}

let audioContext: AudioContext | null = null

const getAudioContext = () => {
  if (typeof window === 'undefined') {
    return null
  }

  if (audioContext?.state === 'closed') {
    audioContext = null
  }

  if (!audioContext) {
    const audioWindow = window as AudioWindow
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext

    if (!AudioContextConstructor) {
      return null
    }

    audioContext = new AudioContextConstructor()
  }

  return audioContext
}

const playTone = (context: AudioContext, step: ToneStep) => {
  const startAt = context.currentTime + step.delay
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = step.type
  oscillator.frequency.setValueAtTime(step.frequency, startAt)
  oscillator.frequency.exponentialRampToValueAtTime(step.frequency * 1.04, startAt + step.duration)

  gainNode.gain.setValueAtTime(0.0001, startAt)
  gainNode.gain.exponentialRampToValueAtTime(step.gain, startAt + 0.012)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + step.duration)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + step.duration + 0.02)
}

export const playUiSound = (sound: UiSound) => {
  const context = getAudioContext()

  if (!context) {
    return
  }

  const playSequence = () => {
    soundMap[sound].forEach((step) => playTone(context, step))
  }

  if (context.state === 'suspended') {
    void context.resume().then(playSequence).catch(() => undefined)
    return
  }

  playSequence()
}