const NOTE_FREQUENCIES = {
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.5,
  B4: 493.88,
  A4: 440,
  G4: 392,
  F4: 349.23,
} as const

type NoteName = keyof typeof NOTE_FREQUENCIES

type NoteStep = {
  note: NoteName
  duration: number
}

type BellStrike = {
  frequency: number
  offset: number
  duration: number
}

const PHRASE: NoteStep[] = [
  { note: 'C5', duration: 0.18 },
  { note: 'E5', duration: 0.18 },
  { note: 'G5', duration: 0.18 },
  { note: 'C6', duration: 0.24 },
  { note: 'B4', duration: 0.18 },
  { note: 'G5', duration: 0.18 },
  { note: 'E5', duration: 0.18 },
  { note: 'C5', duration: 0.24 },
  { note: 'A4', duration: 0.18 },
  { note: 'F4', duration: 0.18 },
  { note: 'G4', duration: 0.18 },
  { note: 'C5', duration: 0.28 },
]

const PHRASE_DURATION = PHRASE.reduce((total, step) => total + step.duration, 0)

const BELL_PATTERN: BellStrike[] = [
  { frequency: 1318.51, offset: 0, duration: 0.22 },
  { frequency: 1318.51, offset: 0.24, duration: 0.22 },
  { frequency: 1567.98, offset: 0.5, duration: 0.34 },
]

const BELL_PATTERN_DURATION = BELL_PATTERN.reduce(
  (total, strike) => Math.max(total, strike.offset + strike.duration),
  0,
)

function createNoiseBuffer(context: AudioContext) {
  const length = Math.max(1, Math.floor(context.sampleRate * 0.08))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const channel = buffer.getChannelData(0)

  for (let index = 0; index < length; index += 1) {
    channel[index] = Math.random() * 2 - 1
  }

  return buffer
}

export class CarnivalAudio {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private noteTimeout: number | null = null
  private percussionInterval: number | null = null
  private disposed = false
  private activeOscillators = new Set<OscillatorNode>()
  private activeNoise = new Set<AudioBufferSourceNode>()

  private ensureContext() {
    if (this.disposed) {
      return null
    }

    if (!this.context) {
      const context = new AudioContext()
      const masterGain = context.createGain()
      masterGain.gain.value = 0.24
      masterGain.connect(context.destination)
      this.context = context
      this.masterGain = masterGain
    }

    return this.context
  }

  async start() {
    const context = this.ensureContext()

    if (!context || !this.masterGain) {
      return
    }

    if (context.state === 'suspended') {
      await context.resume()
    }

    this.stopLoop()
    this.schedulePhrase()
    this.startPercussion()
  }

  stop() {
    this.stopLoop()
  }

  async playBell() {
    const context = this.ensureContext()

    if (!context || !this.masterGain) {
      return
    }

    if (context.state === 'suspended') {
      await context.resume()
    }

    const startTime = context.currentTime + 0.02

    for (const strike of BELL_PATTERN) {
      this.playBellStrike(startTime + strike.offset, strike.frequency, strike.duration)
    }

    await new Promise((resolve) => window.setTimeout(resolve, BELL_PATTERN_DURATION * 1000))
  }

  async dispose() {
    this.stopLoop()
    this.disposed = true

    if (this.context) {
      await this.context.close()
      this.context = null
      this.masterGain = null
    }
  }

  private stopLoop() {
    if (this.noteTimeout !== null) {
      window.clearTimeout(this.noteTimeout)
      this.noteTimeout = null
    }

    if (this.percussionInterval !== null) {
      window.clearInterval(this.percussionInterval)
      this.percussionInterval = null
    }

    for (const oscillator of this.activeOscillators) {
      oscillator.onended = null
      oscillator.stop()
    }

    for (const source of this.activeNoise) {
      source.onended = null
      source.stop()
    }

    this.activeOscillators.clear()
    this.activeNoise.clear()
  }

  private schedulePhrase() {
    const context = this.context
    const masterGain = this.masterGain

    if (!context || !masterGain) {
      return
    }

    let offset = 0

    for (const step of PHRASE) {
      this.playNote(step.note, context.currentTime + offset, step.duration)
      offset += step.duration
    }

    this.noteTimeout = window.setTimeout(() => {
      this.schedulePhrase()
    }, PHRASE_DURATION * 1000)
  }

  private playNote(note: NoteName, startTime: number, duration: number) {
    const context = this.context
    const masterGain = this.masterGain

    if (!context || !masterGain) {
      return
    }

    const oscillator = context.createOscillator()
    const noteGain = context.createGain()

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(NOTE_FREQUENCIES[note], startTime)
    oscillator.frequency.linearRampToValueAtTime(
      NOTE_FREQUENCIES[note] * 1.01,
      startTime + duration,
    )

    noteGain.gain.setValueAtTime(0.0001, startTime)
    noteGain.gain.exponentialRampToValueAtTime(0.36, startTime + 0.03)
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    oscillator.connect(noteGain)
    noteGain.connect(masterGain)

    oscillator.onended = () => {
      this.activeOscillators.delete(oscillator)
      oscillator.disconnect()
      noteGain.disconnect()
    }

    this.activeOscillators.add(oscillator)
    oscillator.start(startTime)
    oscillator.stop(startTime + duration + 0.02)
  }

  private startPercussion() {
    this.triggerPercussion()
    this.percussionInterval = window.setInterval(() => {
      this.triggerPercussion()
    }, 220)
  }

  private playBellStrike(startTime: number, frequency: number, duration: number) {
    const context = this.context
    const masterGain = this.masterGain

    if (!context || !masterGain) {
      return
    }

    const fundamental = context.createOscillator()
    const shimmer = context.createOscillator()
    const strikeGain = context.createGain()
    const shimmerGain = context.createGain()
    const bellFilter = context.createBiquadFilter()

    fundamental.type = 'sine'
    shimmer.type = 'triangle'
    fundamental.frequency.setValueAtTime(frequency, startTime)
    shimmer.frequency.setValueAtTime(frequency * 2.01, startTime)

    bellFilter.type = 'highpass'
    bellFilter.frequency.setValueAtTime(700, startTime)

    strikeGain.gain.setValueAtTime(0.0001, startTime)
    strikeGain.gain.exponentialRampToValueAtTime(0.58, startTime + 0.01)
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    shimmerGain.gain.setValueAtTime(0.0001, startTime)
    shimmerGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.02)
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    fundamental.connect(strikeGain)
    shimmer.connect(shimmerGain)
    strikeGain.connect(bellFilter)
    shimmerGain.connect(bellFilter)
    bellFilter.connect(masterGain)

    const cleanup = () => {
      this.activeOscillators.delete(fundamental)
      this.activeOscillators.delete(shimmer)
      fundamental.disconnect()
      shimmer.disconnect()
      strikeGain.disconnect()
      shimmerGain.disconnect()
      bellFilter.disconnect()
    }

    shimmer.onended = cleanup
    fundamental.onended = null

    this.activeOscillators.add(fundamental)
    this.activeOscillators.add(shimmer)
    fundamental.start(startTime)
    shimmer.start(startTime)
    fundamental.stop(startTime + duration + 0.05)
    shimmer.stop(startTime + duration + 0.05)
  }

  private triggerPercussion() {
    const context = this.context
    const masterGain = this.masterGain

    if (!context || !masterGain) {
      return
    }

    const source = context.createBufferSource()
    const noiseGain = context.createGain()
    const filter = context.createBiquadFilter()
    const startTime = context.currentTime

    source.buffer = createNoiseBuffer(context)
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2600, startTime)
    filter.Q.setValueAtTime(1.4, startTime)

    noiseGain.gain.setValueAtTime(0.42, startTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.05)

    source.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(masterGain)

    source.onended = () => {
      this.activeNoise.delete(source)
      source.disconnect()
      filter.disconnect()
      noiseGain.disconnect()
    }

    this.activeNoise.add(source)
    source.start(startTime)
    source.stop(startTime + 0.05)
  }
}
