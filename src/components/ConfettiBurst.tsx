import { type RefObject, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type ConfettiBurstProps = {
  anchorRef: RefObject<HTMLElement | null>
  burstKey: number
  onComplete: (burstKey: number) => void
}

type Particle = {
  color: string
  drag: number
  flutter: number
  flutterFrequency: number
  gravity: number
  height: number
  phase: number
  rotate: number
  velocityX: number
  velocityY: number
  width: number
}

const PARTICLE_COUNT = 1000
export const CONFETTI_BURST_DURATION_MS = 2800
const confettiPalette = ['#ff4d6d', '#ff7a00', '#ffd60a', '#70e000', '#00d1ff', '#4361ee', '#9b5de5', '#ff66c4']

function createParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (): Particle => {
    const launchAngle = Math.random() * Math.PI * 2
    // Mix slower core particles with fast outer particles so the blast reads as
    // a dense volume instead of a hollow expanding ring.
    const launchSpeed = Math.random() < 0.45 ? 100 + Math.random() * 600 : 800 + Math.random() * 1100
    const sizeVariant = Math.floor(Math.random() * 7)
    const width = sizeVariant === 0 ? 4 : sizeVariant === 1 ? 5 : sizeVariant === 2 ? 8 : 9
    const height = sizeVariant === 0 ? 13 : sizeVariant === 1 ? 18 : sizeVariant === 2 ? 8 : 14

    return {
      velocityX: Math.cos(launchAngle) * launchSpeed,
      velocityY: Math.sin(launchAngle) * launchSpeed - 120,
      drag: 0.8 + Math.random() * 0.55,
      gravity: 520 + Math.random() * 300,
      flutter: 18 + Math.random() * 52,
      flutterFrequency: 4 + Math.random() * 7,
      rotate: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
      phase: Math.random() * Math.PI * 2,
      color: confettiPalette[Math.floor(Math.random() * confettiPalette.length)],
      width,
      height,
    }
  })
}

function interpolate(progress: number, points: readonly [number, number][]) {
  for (let index = 1; index < points.length; index += 1) {
    const [endTime, endValue] = points[index]
    const [startTime, startValue] = points[index - 1]

    if (progress <= endTime) {
      const segmentProgress = (progress - startTime) / (endTime - startTime)
      return startValue + (endValue - startValue) * segmentProgress
    }
  }

  return points[points.length - 1][1]
}

function ConfettiBurst({ anchorRef, burstKey, onComplete }: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const anchor = anchorRef.current

    if (!canvas || !context || !anchor) return

    const canvasWidth = window.innerWidth
    const canvasHeight = window.innerHeight
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = canvasWidth * devicePixelRatio
    canvas.height = canvasHeight * devicePixelRatio
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

    const startTime = performance.now()
    const anchorRect = anchor.getBoundingClientRect()
    const originX = anchorRect.left + anchorRect.width / 2
    const originY = anchorRect.top + anchorRect.height / 2
    const particles = createParticles()
    let animationFrame = 0

    const draw = (now: number) => {
      const elapsed = now - startTime
      context.clearRect(0, 0, canvasWidth, canvasHeight)

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index]
        const delay = (index % 20) * 4.5
        const progress = (elapsed - delay) / CONFETTI_BURST_DURATION_MS

        if (progress < 0 || progress > 1) continue

        const seconds = (elapsed - delay) / 1000
        const dragDistance = (1 - Math.exp(-particle.drag * seconds)) / particle.drag
        const flutter = Math.sin(seconds * particle.flutterFrequency + particle.phase) * particle.flutter * seconds
        const x = particle.velocityX * dragDistance + flutter
        const y = particle.velocityY * dragDistance + 0.5 * particle.gravity * seconds * seconds
        const opacity = interpolate(progress, [
          [0, 0],
          [0.18, 1],
          [0.58, 1],
          [0.82, 0.85],
          [1, 0],
        ])
        const scale = interpolate(progress, [
          [0, 0.2],
          [0.18, 1.15],
          [0.58, 0.9],
          [0.82, 0.72],
          [1, 0.72],
        ])

        context.save()
        context.globalAlpha = opacity
        context.translate(originX + x, originY + y)
        context.rotate(((particle.rotate * seconds + flutter * 0.35) * Math.PI) / 180)
        context.fillStyle = particle.color
        context.shadowColor = particle.color
        context.shadowBlur = 12
        context.fillRect(
          (-particle.width * scale) / 2,
          (-particle.height * scale) / 2,
          particle.width * scale,
          particle.height * scale,
        )
        context.restore()
      }

      if (elapsed <= CONFETTI_BURST_DURATION_MS + 90) {
        animationFrame = window.requestAnimationFrame(draw)
      } else {
        onComplete(burstKey)
      }
    }

    animationFrame = window.requestAnimationFrame(draw)
    return () => {
      window.cancelAnimationFrame(animationFrame)
    }
  }, [anchorRef, burstKey, onComplete])

  return createPortal(<canvas ref={canvasRef} className="slot-machine-confetti__canvas" aria-hidden="true" />, document.body)
}

export default ConfettiBurst
