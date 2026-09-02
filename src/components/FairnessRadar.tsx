import { motion } from 'framer-motion'

import type { Chore, ChoreHistoryStats, HistoryStats, User } from '../types/app'
import { panelMotion } from './panelMotion'

type FairnessRadarProps = {
  chores: Chore[]
  choreHistoryCounts: ChoreHistoryStats
  historyCounts: HistoryStats
  users: User[]
}

function FairnessRadar({
  chores,
  choreHistoryCounts,
  historyCounts,
  users,
}: FairnessRadarProps) {
  const totalAssignments = users.reduce((sum, user) => sum + (historyCounts[user.id] ?? 0), 0)
  const expectedShare = users.length > 0 ? 1 / users.length : 0
  const expectedShareLabel = `${(expectedShare * 100).toFixed(0)}% each`

  return (
    <motion.aside className="glass-panel p-5 sm:p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700/60">Fairness ledger</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">Distribution</h2>
        </div>
        <div className="rounded-full border border-amber-900/20 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-950">
          Fair draw
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-700/70">Historical burden</p>
            <p className="mt-1 text-sm text-stone-700/80">Per chore expected share: {expectedShareLabel}</p>
          </div>
          <p className="text-sm font-semibold text-stone-800">{totalAssignments} total</p>
        </div>

        <div className="space-y-3">
          {users.length > 0 && chores.length > 0 ? (
            users.map((user, index) => {
              const count = historyCounts[user.id] ?? 0

              return (
                <motion.div
                  key={user.id}
                  className="leader-row flex-col items-stretch gap-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-stone-900">{user.name}</p>
                      <p className="text-sm text-stone-700/80">
                        {count} delegations across all rounds
                      </p>
                    </div>
                    <div className="rounded-full border border-[#8d683a] bg-[#e3c792] px-3 py-1 text-xs font-black text-stone-900">
                      {chores.length} chores
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-700/70">Audit trail</p>
                    {chores.map((chore) => {
                      const choreCounts = choreHistoryCounts[chore.id] ?? {}
                      const choreTotal = users.reduce((sum, item) => sum + (choreCounts[item.id] ?? 0), 0)
                      const choreUserCount = choreCounts[user.id] ?? 0
                      const choreShare = choreTotal > 0 ? choreUserCount / choreTotal : 0

                      return (
                        <div key={chore.id} className="grid gap-1.5">
                          <div className="flex items-center justify-between gap-3 text-sm text-stone-800">
                            <span className="min-w-0 truncate">{chore.name}</span>
                            <span className="shrink-0 font-black">
                              {choreUserCount} · {(choreShare * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full border border-[#8d683a]/60 bg-[#dec28a]">
                            <div
                              className="h-full rounded-full bg-[#8b5e24]"
                              style={{ width: `${choreShare > 0 ? Math.max(4, choreShare * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="empty-state">Add users and chores to see burden percentages.</div>
          )}
        </div>
      </div>

    </motion.aside>
  )
}

export default FairnessRadar
