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
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80" />
      <div className="relative z-10 grid gap-8 xl:grid-cols-[1.5fr_0.9fr] xl:items-center">
        <div>
          <motion.p
            className="mb-3 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.42em] text-fuchsia-100 shadow-[0_0_40px_rgba(255,255,255,0.12)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Wheel of (Un)Fortune · Deluxe Meltdown Edition
          </motion.p>

          <motion.h1
            className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-6xl xl:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
          >
            More thunder.
            <br />
            More neon.
            <br />
            More chore-fueled drama.
          </motion.h1>

          <motion.p
            className="mt-5 max-w-2xl text-base text-white/78 sm:text-lg"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.65 }}
          >
            This is no longer a polite productivity app. It is a glowing arena of assignment fate,
            where every spin feels like a season finale and every chore lands with theatrical excess.
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
          className="relative min-h-[20rem] rounded-[2rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_30px_120px_rgba(0,0,0,0.45)]"
          initial={{ opacity: 0, scale: 0.96, rotate: -1.5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.12, duration: 0.7 }}
        >
          <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.3),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.32),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">Showtime status</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Chaos command board</h2>
              </div>
              <motion.div
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                animate={isSpinning ? { scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, repeat: isSpinning ? Infinity : 0 }}
              >
                {isSpinning ? 'LIVE' : 'ARMED'}
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

            <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                <span>Round pressure</span>
                <span>{assignedPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#f97316_0%,#fb7185_28%,#a855f7_62%,#22d3ee_100%)] shadow-[0_0_30px_rgba(249,115,22,0.45)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${assignedPercent}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="mt-3 text-sm text-white/72">{message}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default HeroSection
