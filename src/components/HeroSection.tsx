import { motion } from 'framer-motion'

import { panelMotion } from './panelMotion'

type HeroSectionProps = {
  assignedPercent: number
  assignmentsCount: number
  canSpin: boolean
  isSpinning: boolean
  message: string
  onResetEverything: () => void
  onResetRound: () => void
  onRunSpin: () => void
  remainingChoresCount: number
  usersCount: number
}

function HeroSection({
  assignedPercent,
  assignmentsCount,
  canSpin,
  isSpinning,
  message,
  onResetEverything,
  onResetRound,
  onRunSpin,
  remainingChoresCount,
  usersCount,
}: HeroSectionProps) {
  return (
    <motion.section
      className="hero-panel mb-6 overflow-hidden p-6 sm:p-8 xl:p-10"
      initial="hidden"
      animate="visible"
      variants={panelMotion}
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/70 to-transparent opacity-80" />
      <div className="relative z-10 grid gap-8 xl:grid-cols-[1.5fr_0.9fr] xl:items-center">
        <div>
          <motion.p
            className="mb-3 inline-flex rounded-full border border-amber-900/40 bg-amber-100/80 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.42em] text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Wheel of Misfortune · Prize Wheel Ledger
          </motion.p>

          <motion.h1
            className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-amber-50 sm:text-6xl xl:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
          >
            More brass.
            <br />
            More timber.
            <br />
            More chore-wheel fate.
          </motion.h1>

          <motion.p
            className="mt-5 max-w-2xl text-base text-amber-100/85 sm:text-lg"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.65 }}
          >
            Styled more like an old fantasy prize wheel than a startup dashboard. Set the roster,
            load the chores, then let the wheel decide who draws the unlucky slot.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.55 }}
          >
            <button className="dramatic-button dramatic-button-primary" onClick={onRunSpin} disabled={!canSpin}>
              {isSpinning
                ? 'Spinning the apocalypse…'
                : remainingChoresCount === 0
                  ? 'All chores assigned'
                  : 'Unleash the wheel'}
            </button>
            <button className="dramatic-button dramatic-button-muted" onClick={onResetRound} disabled={isSpinning}>
              Reset round
            </button>
            <button className="dramatic-button dramatic-button-danger" onClick={onResetEverything} disabled={isSpinning}>
              Reset everything
            </button>
          </motion.div>
        </div>

        <motion.div
          className="relative min-h-[20rem] rounded-[2rem] border border-amber-950/60 bg-[linear-gradient(180deg,rgba(71,44,19,0.95),rgba(36,22,10,0.97))] p-5 shadow-[inset_0_1px_0_rgba(255,242,204,0.18),0_24px_70px_rgba(20,12,4,0.45)]"
          initial={{ opacity: 0, scale: 0.96, rotate: -1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.12, duration: 0.7 }}
        >
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_28%),linear-gradient(180deg,rgba(255,248,220,0.06),rgba(0,0,0,0.08))]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/60">Wheel status</p>
                <h2 className="mt-1 text-2xl font-bold text-amber-50">Prize board</h2>
              </div>
              <motion.div
                className="rounded-full border border-amber-700/40 bg-amber-100/10 px-4 py-2 text-sm font-semibold text-amber-100"
                animate={isSpinning ? { scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, repeat: isSpinning ? Infinity : 0 }}
              >
                {isSpinning ? 'SPINNING' : 'READY'}
              </motion.div>
            </div>

            <div className="score-grid">
              <div className="score-tile">
                <span>Total crew</span>
                <strong>{usersCount}</strong>
              </div>
              <div className="score-tile">
                <span>Chores on deck</span>
                <strong>{remainingChoresCount}</strong>
              </div>
              <div className="score-tile">
                <span>Assigned this round</span>
                <strong>{assignmentsCount}</strong>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-amber-900/50 bg-[rgba(28,16,6,0.58)] p-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/55">
                <span>Round progress</span>
                <span>{assignedPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full border border-amber-950/60 bg-amber-950/40">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#c08c2d_0%,#e7c263_45%,#f5dfa0_100%)] shadow-[0_0_16px_rgba(192,140,45,0.35)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${assignedPercent}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="mt-3 text-sm text-amber-50/78">{message}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default HeroSection
