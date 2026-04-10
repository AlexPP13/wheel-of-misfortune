import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import type { User } from '../types/app'
import { panelMotion } from './panelMotion'

type DoomDomeSectionProps = {
  activeUserId: string | null
  canSpin: boolean
  confettiBurstKey: number
  currentChoreName: string
  idleHint?: string
  isReelSpinning: boolean
  isSpinning: boolean
  message: string
  onResetRound: () => void
  onRunSpin: () => void
  users: User[]
}

const confettiPalette = ['#ff4d6d', '#ff7a00', '#ffd60a', '#70e000', '#00d1ff', '#4361ee', '#9b5de5', '#ff66c4']

const confettiPieces = Array.from({ length: 64 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 64
  const ring = index % 4
  const distance = 120 + ring * 36 + (index % 3) * 18
  const upwardLift = 80 + (index % 5) * 18
  const drift = ring % 2 === 0 ? 1 : -1

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * (distance * 0.72) - upwardLift,
    rotate: drift * (180 + ring * 45 + (index % 6) * 22),
    color: confettiPalette[index % confettiPalette.length],
    delay: (index % 8) * 0.012,
  }
})

function DoomDomeSection({
  activeUserId,
  canSpin,
  confettiBurstKey,
  currentChoreName,
  idleHint,
  isReelSpinning,
  isSpinning,
  message,
  onResetRound,
  onRunSpin,
  users,
}: DoomDomeSectionProps) {
  const activeUser = activeUserId ? users.find((user) => user.id === activeUserId) ?? null : null
  const activeIndex = activeUserId ? users.findIndex((user) => user.id === activeUserId) : 0
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0
  const spinningReelUsers = users.length > 0 ? [...users, ...users, ...users, ...users, ...users, ...users] : []
  const staticReelUsers =
    users.length > 0
      ? [
          users[(safeActiveIndex - 2 + users.length) % users.length],
          users[(safeActiveIndex - 1 + users.length) % users.length],
          users[safeActiveIndex],
          users[(safeActiveIndex + 1) % users.length],
          users[(safeActiveIndex + 2) % users.length],
        ]
      : []

  return (
    <motion.div className="stage-panel overflow-hidden p-5 sm:p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <div className="arena-shell">
        <div className="mt-6 w-full text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-100/55">Current chore</p>
          <AnimatePresence mode="wait">
            <motion.h3
              key={currentChoreName}
              className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-amber-50 sm:text-5xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
            >
              {currentChoreName}
            </motion.h3>
          </AnimatePresence>

          <div className="slot-machine-shell mt-6">
            <div className="slot-machine-window">
              <div className="slot-machine-window__mask" />
              {users.length > 0 ? (
                isReelSpinning ? (
                  <div className="slot-reel slot-reel-spinning">
                    {spinningReelUsers.map((user, index) => (
                      <div key={`${user.id}-${index}`} className="slot-reel__item">
                        {user.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeUser?.id ?? 'idle'}
                      className="slot-reel"
                      initial={{ opacity: 0.75, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0.75, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                    >
                      {staticReelUsers.map((user, index) => (
                        <div
                          key={`${user.id}-${index}`}
                          className={['slot-reel__item', index === 2 ? 'slot-reel__item-active' : '']
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {user.name}
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )
              ) : (
                <div className="slot-reel__empty">{idleHint ?? 'Add users to load the reel'}</div>
              )}
              <AnimatePresence>
                {confettiBurstKey > 0 ? (
                  <motion.div
                    key={confettiBurstKey}
                    className="slot-machine-confetti"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    {confettiPieces.map((piece, index) => (
                      <motion.span
                        key={`${confettiBurstKey}-${index}`}
                        className="slot-machine-confetti__piece"
                        style={{ '--confetti-color': piece.color } as CSSProperties}
                        initial={{ x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.2 }}
                        animate={{
                          x: piece.x,
                          y: piece.y,
                          opacity: [0, 1, 1, 0.85, 0],
                          rotate: piece.rotate,
                          scale: [0.2, 1.15, 0.9, 0.72],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.15, ease: [0.2, 0.8, 0.2, 1], delay: piece.delay }}
                      />
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <div className="slot-machine-pointer" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button className="dramatic-button dramatic-button-primary" onClick={onRunSpin} disabled={!canSpin}>
              {isSpinning ? 'Spinning...' : 'Spin wheel'}
            </button>
            <button className="dramatic-button dramatic-button-muted" onClick={onResetRound} disabled={isSpinning}>
              Reset round
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-amber-100/72">{message}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default DoomDomeSection
