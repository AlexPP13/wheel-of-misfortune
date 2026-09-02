function playTone(context: AudioContext, destination: AudioNode, frequency: number, offset: number, duration: number) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const startTime = context.currentTime + offset

  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, startTime + duration)
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(0.22, startTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  oscillator.connect(gain)
  gain.connect(destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.02)
}

function playImpact(context: AudioContext, destination: AudioNode, offset: number) {
  const length = Math.max(1, Math.floor(context.sampleRate * 0.16))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const channel = buffer.getChannelData(0)

  for (let index = 0; index < length; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / length)
  }

  const source = context.createBufferSource()
  const gain = context.createGain()
  const filter = context.createBiquadFilter()
  const startTime = context.currentTime + offset

  source.buffer = buffer
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(520, startTime)
  gain.gain.setValueAtTime(0.5, startTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(destination)
  source.start(startTime)
  source.stop(startTime + 0.22)
}

export function playBattleCountdown() {
  const AudioContextConstructor = window.AudioContext
  const context = new AudioContextConstructor()
  const masterGain = context.createGain()
  masterGain.gain.value = 0.18
  masterGain.connect(context.destination)
  void context.resume()

  playTone(context, masterGain, 146.83, 0, 0.14)
  playTone(context, masterGain, 174.61, 0.25, 0.14)
  playTone(context, masterGain, 220, 0.5, 0.18)
  window.setTimeout(() => void context.close(), 950)
}

function playSwordClash(context: AudioContext, destination: AudioNode, offset: number) {
  const length = Math.max(1, Math.floor(context.sampleRate * 0.11))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const channel = buffer.getChannelData(0)

  for (let index = 0; index < length; index += 1) {
    const decay = 1 - index / length
    channel[index] = (Math.random() * 2 - 1) * decay * decay
  }

  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()
  const startTime = context.currentTime + offset
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(2800, startTime)
  filter.Q.value = 1.8
  gain.gain.setValueAtTime(0.38, startTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.13)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(destination)
  source.start(startTime)
  source.stop(startTime + 0.14)
  playTone(context, destination, 780, offset, 0.1)
}

/** An original arcade-fighter sequence: warning pulse, clashes, then a final impact. */
export function playBattleSequence() {
  const AudioContextConstructor = window.AudioContext
  const context = new AudioContextConstructor()
  const masterGain = context.createGain()
  masterGain.gain.value = 0.22
  masterGain.connect(context.destination)
  void context.resume()

  playTone(context, masterGain, 92, 0, 0.38)
  playTone(context, masterGain, 116.54, 0.34, 0.32)
  playSwordClash(context, masterGain, 0.92)
  playSwordClash(context, masterGain, 1.32)
  playSwordClash(context, masterGain, 1.72)
  playSwordClash(context, masterGain, 2.38)
  playSwordClash(context, masterGain, 2.98)
  playSwordClash(context, masterGain, 3.58)
  playImpact(context, masterGain, 4.55)
  playTone(context, masterGain, 246.94, 4.56, 0.38)
  window.setTimeout(() => void context.close(), 5400)
}

export function playBattleSpectacle(announcement: string) {
  const AudioContextConstructor = window.AudioContext
  const context = new AudioContextConstructor()
  const masterGain = context.createGain()

  masterGain.gain.value = 0.28
  masterGain.connect(context.destination)
  void context.resume()

  playTone(context, masterGain, 110, 0, 0.34)
  playTone(context, masterGain, 146.83, 0.12, 0.34)
  playTone(context, masterGain, 196, 0.24, 0.42)
  playImpact(context, masterGain, 0.48)
  window.setTimeout(() => void context.close(), 1200)

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(announcement)
    utterance.rate = 0.86
    utterance.pitch = 0.55
    utterance.volume = 0.9
    window.speechSynthesis.speak(utterance)
  }
}
