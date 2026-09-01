import { type RefObject, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type ConfettiBurstProps = {
  anchorRef: RefObject<HTMLElement | null>
  burstKey: number
  onComplete: (burstKey: number) => void
}

type Particle = {
  color: string
  height: number
  rotate: number
  width: number
  x: number
  y: number
}

const PARTICLE_COUNT = 1000
const BURST_DURATION_MS = 1150
const confettiPalette = ['#ff4d6d', '#ff7a00', '#ffd60a', '#70e000', '#00d1ff', '#4361ee', '#9b5de5', '#ff66c4']

function createParticles(maxDistance: number) {
  return Array.from({ length: PARTICLE_COUNT }, (): Particle => {
    const angle = Math.random() * Math.PI * 2
    const distance = maxDistance * (1.25 + Math.random() * 0.35)
    const sizeVariant = Math.floor(Math.random() * 7)
    const width = sizeVariant === 0 ? 4 : sizeVariant === 1 ? 5 : sizeVariant === 2 ? 8 : 9
    const height = sizeVariant === 0 ? 13 : sizeVariant === 1 ? 18 : sizeVariant === 2 ? 8 : 14

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * (distance * (0.55 + Math.random() * 0.3)) - (80 + Math.random() * 240),
      rotate: (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 420),
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
    const particles = createParticles(Math.hypot(canvasWidth, canvasHeight))
    let animationFrame = 0

    const draw = (now: number) => {
      const elapsed = now - startTime
      context.clearRect(0, 0, canvasWidth, canvasHeight)

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index]
        const delay = (index % 20) * 4.5
        const progress = (elapsed - delay) / BURST_DURATION_MS

        if (progress < 0 || progress > 1) continue

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
        context.translate(originX + particle.x * progress, originY + particle.y * progress)
        context.rotate((particle.rotate * progress * Math.PI) / 180)
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

      if (elapsed <= BURST_DURATION_MS + 90) {
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
