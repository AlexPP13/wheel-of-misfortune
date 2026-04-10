import { AnimatePresence, motion } from 'framer-motion'

import type { User } from '../types/app'
import { panelMotion } from './panelMotion'

type DoomDomeSectionProps = {
  activeUserId: string | null
  canSpin: boolean
  currentChoreName: string
  isReelSpinning: boolean
  isSpinning: boolean
  message: string
  onEditChores: () => void
  onEditUsers: () => void
  onResetEverything: () => void
  onResetRound: () => void
  onRunSpin: () => void
  users: User[]
}

function DoomDomeSection({
  activeUserId,
  canSpin,
  currentChoreName,
  isReelSpinning,
  isSpinning,
  message,
  onEditChores,
  onEditUsers,
  onResetEverything,
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
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/65">Main wheel</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] text-amber-50 sm:text-4xl">The prize wheel</h2>
        </div>
        <div className="rounded-full border border-amber-900/50 bg-amber-950/35 px-4 py-2 text-sm font-semibold text-amber-50/86">
          Current chore: <span className="text-amber-200">{currentChoreName}</span>
        </div>
      </div>

      <div className="arena-shell">
        <div className="arena-core">
          <motion.div
            className="spotlight-chip"
            animate={isReelSpinning ? { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.95, repeat: isReelSpinning ? Infinity : 0 }}
          >
            {isReelSpinning ? 'SCANNING FOR A VOLUNTEER' : 'READY FOR A SPIN'}
          </motion.div>

          <div className="mt-6 w-full max-w-md text-center">
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
                  <div className="slot-reel__empty">Add users to load the reel</div>
                )}
                <div className="slot-machine-pointer" />
              </div>
            </div>

            <p className="mt-4 text-sm text-amber-100/72 sm:text-base">
              {activeUser ? `${activeUser.name} is under the pointer.` : 'Spin the wheel to start the draw.'}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="dramatic-button dramatic-button-primary" onClick={onRunSpin} disabled={!canSpin}>
              {isSpinning ? 'Spinning...' : 'Spin wheel'}
            </button>
            <button className="dramatic-button dramatic-button-muted" onClick={onResetRound} disabled={isSpinning}>
              Reset round
            </button>
            <button className="dramatic-button dramatic-button-muted" onClick={onEditUsers} disabled={isSpinning}>
              Edit users
            </button>
            <button className="dramatic-button dramatic-button-muted" onClick={onEditChores} disabled={isSpinning}>
              Edit chores
            </button>
            <button className="dramatic-button dramatic-button-danger" onClick={onResetEverything} disabled={isSpinning}>
              Reset all
            </button>
          </div>

          <p className="mt-4 max-w-xl text-center text-sm text-amber-100/72">{message}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default DoomDomeSection
