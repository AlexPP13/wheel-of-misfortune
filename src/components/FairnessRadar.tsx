import { motion } from 'framer-motion'

import type { HistoryStats, User } from '../types/app'
import { panelMotion } from './panelMotion'

type FairnessRadarProps = {
  fairnessLeaders: User[]
  historyCounts: HistoryStats
}

function FairnessRadar({ fairnessLeaders, historyCounts }: FairnessRadarProps) {
  return (
    <motion.aside className="glass-panel p-5 sm:p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700/60">Fairness ledger</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">Lowest burden</h2>
        </div>
        <div className="rounded-full border border-amber-900/20 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-950">
          Fair draw
        </div>
      </div>

      <div className="space-y-3">
        {fairnessLeaders.length > 0 ? (
          fairnessLeaders.map((user, index) => (
            <motion.div
              key={user.id}
              className="leader-row"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="leader-rank">{index + 1}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-stone-900">{user.name}</p>
                <p className="text-sm text-stone-700/80">{historyCounts[user.id] ?? 0} chores across all rounds</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-state">Nobody on the board yet.</div>
        )}
      </div>

      <div className="mt-6 rounded-[1.75rem] border border-amber-900/15 bg-amber-50/65 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-700/70">Wheel notes</p>
        <ul className="mt-4 space-y-3 text-sm text-stone-700/85">
          <li>• Every chore is assigned exactly once per round.</li>
          <li>• Historical counts still keep the pain distributed fairly.</li>
          <li>• Edit the setup at any time without breaking the round flow.</li>
        </ul>
      </div>
    </motion.aside>
  )
}

export default FairnessRadar
