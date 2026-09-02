export type ResultSound =
  | 'reel-stop'
  | 'ka-ching'
  | 'coin-cascade'
  | 'fruit-machine'
  | 'jackpot-fanfare'
  | 'arcade-cheer'

// Match the reel cadence in App.tsx: quick clicks at the start, then a gradual slowdown.
const SLOT_TICK_START_DELAY_MS = 85
const SLOT_TICK_DELAY_INCREMENT_MS = 16
const SLOT_TICK_COUNT = 12

function createNoiseBuffer(context: AudioContext, duration = 0.08) {
  const length = Math.max(1, Math.floor(context.sampleRate * duration))
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
  private tickTimeout: number | null = null
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
    this.scheduleReelTick(0)
  }

  stop() {
    this.stopLoop()
  }

  async playBell(sound: ResultSound = 'ka-ching') {
    const context = this.ensureContext()

    if (!context || !this.masterGain) {
      return
    }

    if (context.state === 'suspended') {
      await context.resume()
    }

    const startTime = context.currentTime + 0.02

    const duration = this.playResultSound(sound, startTime)
    await new Promise((resolve) => window.setTimeout(resolve, duration * 1000))
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
    if (this.tickTimeout !== null) {
      window.clearTimeout(this.tickTimeout)
      this.tickTimeout = null
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

  private scheduleReelTick(tickIndex: number) {
    const context = this.context

    if (!context) {
      return
    }

    this.triggerReelTick(context.currentTime, tickIndex)
    const nextTickIndex = tickIndex === SLOT_TICK_COUNT ? 0 : tickIndex + 1
    const delay = SLOT_TICK_START_DELAY_MS + tickIndex * SLOT_TICK_DELAY_INCREMENT_MS

    this.tickTimeout = window.setTimeout(() => this.scheduleReelTick(nextTickIndex), delay)
  }

  private triggerReelTick(startTime: number, tickIndex: number) {
    const context = this.context
    const masterGain = this.masterGain

    if (!context || !masterGain) {
      return
    }

    const source = context.createBufferSource()
    const noiseGain = context.createGain()
    const filter = context.createBiquadFilter()
    const click = context.createOscillator()
    const clickGain = context.createGain()

    source.buffer = createNoiseBuffer(context)
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2500 - tickIndex * 65, startTime)
    filter.Q.setValueAtTime(2.6, startTime)

    noiseGain.gain.setValueAtTime(0.32, startTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035)
    click.type = 'square'
    click.frequency.setValueAtTime(980 - tickIndex * 20, startTime)
    click.frequency.exponentialRampToValueAtTime(240, startTime + 0.045)
    clickGain.gain.setValueAtTime(0.14, startTime)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.045)

    source.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(masterGain)
    click.connect(clickGain)
    clickGain.connect(masterGain)

    source.onended = () => {
      this.activeNoise.delete(source)
      source.disconnect()
      filter.disconnect()
      noiseGain.disconnect()
    }

    click.onended = () => {
      this.activeOscillators.delete(click)
      click.disconnect()
      clickGain.disconnect()
    }

    this.activeNoise.add(source)
    this.activeOscillators.add(click)
    source.start(startTime)
    source.stop(startTime + 0.04)
    click.start(startTime)
    click.stop(startTime + 0.05)
  }

  private playResultSound(sound: ResultSound, startTime: number) {
    switch (sound) {
      case 'reel-stop': {
        let offset = 0

        for (let index = 0; index < SLOT_TICK_COUNT; index += 1) {
          this.playNoise(startTime + offset, 0.035, 2600 - index * 75, 0.16)
          this.playTone(startTime + offset, 900 - index * 25, 0.045, 'square', 0.07, 220)
          offset += 0.06 + index * 0.016
        }

        return 1.6
      }
      case 'ka-ching':
        this.playNoise(startTime, 0.06, 1100, 0.18)
        this.playTone(startTime, 180, 0.07, 'square', 0.14, 105)
        this.playTone(startTime + 0.07, 1550, 0.12, 'sine', 0.2, 2100)
        this.playTone(startTime + 0.07, 2730, 0.22, 'sine', 0.11, 3100)
        return 0.29
      case 'coin-cascade':
        for (const [index, offset] of [0, 0.09, 0.18, 0.3, 0.43, 0.56].entries()) {
          this.playTone(startTime + offset, 2500 - index * 135, 0.16, 'sine', 0.16, 1900 - index * 70)
          this.playTone(startTime + offset, 4100 - index * 120, 0.07, 'triangle', 0.06, 3300)
        }
        return 0.74
      case 'fruit-machine':
        for (const [frequency, offset] of [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.52]]) {
          this.playTone(startTime + offset, frequency, 0.22, 'square', 0.11)
        }
        return 0.74
      case 'jackpot-fanfare':
        for (const [index, [frequency, offset]] of [[392, 0], [523, 0.1], [659, 0.2], [784, 0.3], [1047, 0.42]].entries()) {
          this.playTone(startTime + offset, frequency, index === 4 ? 0.68 : 0.2, 'triangle', 0.15)
        }
        return 1.1
      case 'arcade-cheer':
        this.playNoise(startTime, 1.15, 850, 0.1)
        for (const [index, frequency] of [155, 185, 220, 262, 294].entries()) {
          this.playTone(startTime + index * 0.08, frequency, 0.8, 'sawtooth', 0.045, frequency * 1.35)
        }
        return 1.2
    }
  }

  private playTone(
    startTime: number,
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.18,
    endFrequency = frequency,
  ) {
    const context = this.context
    const masterGain = this.masterGain

    if (!context || !masterGain) {
      return
    }

    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, startTime)
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startTime + duration)
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
    oscillator.connect(gain)
    gain.connect(masterGain)

    oscillator.onended = () => {
      this.activeOscillators.delete(oscillator)
      oscillator.disconnect()
      gain.disconnect()
    }

    this.activeOscillators.add(oscillator)
    oscillator.start(startTime)
    oscillator.stop(startTime + duration + 0.02)
  }

  private playNoise(startTime: number, duration: number, frequency: number, volume = 0.14) {
    const context = this.context
    const masterGain = this.masterGain

    if (!context || !masterGain) {
      return
    }

    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()

    source.buffer = createNoiseBuffer(context, duration)
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(frequency, startTime)
    filter.Q.setValueAtTime(2, startTime)
    gain.gain.setValueAtTime(volume, startTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(masterGain)

    source.onended = () => {
      this.activeNoise.delete(source)
      source.disconnect()
      filter.disconnect()
      gain.disconnect()
    }

    this.activeNoise.add(source)
    source.start(startTime)
    source.stop(startTime + duration)
  }
}
