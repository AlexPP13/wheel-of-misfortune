type BellStrike = {
  frequency: number
  offset: number
  duration: number
}

// Match the reel cadence in App.tsx: quick clicks at the start, then a gradual slowdown.
const SLOT_TICK_START_DELAY_MS = 85
const SLOT_TICK_DELAY_INCREMENT_MS = 16
const SLOT_TICK_COUNT = 12

// A coin-like cash-register win: a mechanical "ka" followed by a sharp metallic "tjing".
const KA_CHING_PATTERN: BellStrike[] = [
  { frequency: 1396.91, offset: 0.035, duration: 0.13 },
  { frequency: 2349.32, offset: 0.115, duration: 0.46 },
]

const KA_CHING_PATTERN_DURATION = KA_CHING_PATTERN.reduce(
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

  async playBell() {
    const context = this.ensureContext()

    if (!context || !this.masterGain) {
      return
    }

    if (context.state === 'suspended') {
      await context.resume()
    }

    const startTime = context.currentTime + 0.02

    this.triggerReelTick(startTime, 0)

    for (const strike of KA_CHING_PATTERN) {
      this.playBellStrike(startTime + strike.offset, strike.frequency, strike.duration)
    }

    await new Promise((resolve) => window.setTimeout(resolve, KA_CHING_PATTERN_DURATION * 1000))
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

  private playBellStrike(startTime: number, frequency: number, duration: number) {
    const context = this.context
    const masterGain = this.masterGain

    if (!context || !masterGain) {
      return
    }

    const fundamental = context.createOscillator()
    const shimmer = context.createOscillator()
    const strike = context.createOscillator()
    const strikeGain = context.createGain()
    const shimmerGain = context.createGain()
    const attackGain = context.createGain()

    fundamental.type = 'sine'
    shimmer.type = 'sine'
    strike.type = 'triangle'
    fundamental.frequency.setValueAtTime(frequency, startTime)
    // Slightly inharmonic upper partials give the single note a real struck-chime character.
    shimmer.frequency.setValueAtTime(frequency * 2.76, startTime)
    strike.frequency.setValueAtTime(frequency * 4.2, startTime)
    strikeGain.gain.setValueAtTime(0.0001, startTime)
    strikeGain.gain.exponentialRampToValueAtTime(0.58, startTime + 0.006)
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
    shimmerGain.gain.setValueAtTime(0.0001, startTime)
    shimmerGain.gain.exponentialRampToValueAtTime(0.32, startTime + 0.006)
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.78)
    attackGain.gain.setValueAtTime(0.0001, startTime)
    attackGain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.002)
    attackGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07)
    fundamental.connect(strikeGain)
    shimmer.connect(shimmerGain)
    strike.connect(attackGain)
    strikeGain.connect(masterGain)
    shimmerGain.connect(masterGain)
    attackGain.connect(masterGain)

    const cleanup = () => {
      this.activeOscillators.delete(fundamental)
      this.activeOscillators.delete(shimmer)
      this.activeOscillators.delete(strike)
      fundamental.disconnect()
      shimmer.disconnect()
      strike.disconnect()
      strikeGain.disconnect()
      shimmerGain.disconnect()
      attackGain.disconnect()
    }

    fundamental.onended = cleanup
    this.activeOscillators.add(fundamental)
    this.activeOscillators.add(shimmer)
    this.activeOscillators.add(strike)
    fundamental.start(startTime)
    shimmer.start(startTime)
    strike.start(startTime)
    fundamental.stop(startTime + duration + 0.05)
    shimmer.stop(startTime + duration * 0.82)
    strike.stop(startTime + 0.075)
  }
}
