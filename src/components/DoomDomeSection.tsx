import { AnimatePresence, motion } from 'framer-motion'

import type { User } from '../types/app'
import { panelMotion } from './panelMotion'

type DoomDomeSectionProps = {
  activeUserId: string | null
  canSpin: boolean
  currentChoreName: string
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
        <motion.div
          className="arena-ring arena-ring-outer"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="arena-ring arena-ring-inner"
          animate={{ rotate: -360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        />

        <div className="arena-core">
          <motion.div
            className="spotlight-chip"
            animate={isSpinning ? { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.95, repeat: isSpinning ? Infinity : 0 }}
            >
            {isSpinning ? 'SCANNING FOR A VOLUNTEER' : 'READY FOR A SPIN'}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentChoreName}-${activeUser?.id ?? 'idle'}`}
              className="text-center"
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.95 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/45">Now threatening</p>
              <h3 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] text-amber-50 sm:text-5xl">
                {currentChoreName}
              </h3>
              <p className="mt-4 text-sm text-amber-100/72 sm:text-base">
                {activeUser
                  ? `${activeUser.name} is currently under the pointer.`
                  : 'Spin the wheel and let the pointer settle.'}
              </p>
            </motion.div>
          </AnimatePresence>

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
