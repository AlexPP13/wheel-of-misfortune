import { AnimatePresence, motion } from 'framer-motion'

import { getUserAura } from '../lib/app-state'
import type { HistoryStats, User } from '../types/app'
import { panelMotion } from './panelMotion'

type DoomDomeSectionProps = {
  activeUserId: string | null
  currentChoreName: string
  fairnessRank: Record<string, number>
  historyCounts: HistoryStats
  isSpinning: boolean
  users: User[]
}

function DoomDomeSection({
  activeUserId,
  currentChoreName,
  fairnessRank,
  historyCounts,
  isSpinning,
  users,
}: DoomDomeSectionProps) {
  const activeUser = activeUserId ? users.find((user) => user.id === activeUserId) ?? null : null

  return (
    <motion.div className="stage-panel overflow-hidden p-5 sm:p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200/65">Main event</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] text-white sm:text-4xl">The doom dome</h2>
        </div>
        <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white/86">
          Current chore: <span className="text-yellow-200">{currentChoreName}</span>
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
            {isSpinning ? 'SCANNING FOR A VOLUNTEER' : 'READY FOR IMPACT'}
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
              <h3 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">
                {currentChoreName}
              </h3>
              <p className="mt-4 text-sm text-white/72 sm:text-base">
                {activeUser
                  ? `${activeUser.name} is currently in the spotlight.`
                  : 'Spin the machine and let the lasers decide.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {users.length > 0 ? (
            users.map((user, index) => {
              const isActive = activeUserId === user.id
              const choresTaken = historyCounts[user.id] ?? 0

              return (
                <motion.article
                  key={user.id}
                  className={[
                    'contestant-card',
                    isActive ? 'contestant-card-active' : '',
                    `bg-gradient-to-br ${getUserAura(index)}`,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isActive
                      ? {
                          opacity: 1,
                          y: 0,
                          scale: [1, 1.04, 1.01],
                          boxShadow: [
                            '0 0 0 rgba(255,255,255,0)',
                            '0 0 50px rgba(249,115,22,0.35)',
                            '0 0 26px rgba(168,85,247,0.28)',
                          ],
                        }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  transition={{ duration: 0.45 }}
                >
                  <div className="contestant-card__overlay" />
                  <div className="relative z-10 flex h-full flex-col justify-between gap-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/60">
                          Contestant {String(index + 1).padStart(2, '0')}
                        </p>
                        <h3 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                          {user.name}
                        </h3>
                      </div>
                      <motion.span
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90"
                        animate={isActive ? { y: [-1, -6, -1] } : { y: 0 }}
                        transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
                      >
                        {isActive ? 'Chosen?' : 'Waiting'}
                      </motion.span>
                    </div>

                    <div className="space-y-2 text-sm text-white/82">
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
                        <span>Total chores survived</span>
                        <strong className="text-white">{choresTaken}</strong>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
                        <span>Fairness rank</span>
                        <strong className="text-white">#{fairnessRank[user.id] ?? users.length}</strong>
                      </div>
                    </div>
                  </div>
                </motion.article>
              )
            })
          ) : (
            <motion.div className="empty-state md:col-span-2 xl:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Add a user and the arena will conjure contender cards.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default DoomDomeSection
