import { AnimatePresence, motion } from 'framer-motion'

import type { AssignmentRow } from '../types/app'
import { panelMotion } from './panelMotion'

type AssignmentsPanelProps = {
  assignmentRows: AssignmentRow[]
}

function AssignmentsPanel({ assignmentRows }: AssignmentsPanelProps) {
  return (
    <motion.div className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Round ledger</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">This round</h2>
        </div>
        <span className="count-pill">{assignmentRows.length}</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {assignmentRows.length > 0 ? (
            assignmentRows.map((assignment, index) => (
              <motion.div
                key={assignment.choreId}
                className="assignment-card"
                initial={{ opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="assignment-card__meta">
                  <span className="assignment-card__index">Draw {index + 1}</span>
                  <span className="assignment-card__label">Assigned to</span>
                </div>
                <div className="assignment-card__body">
                  <div className="assignment-card__person">
                    <p className="assignment-card__person-label">Assigned to</p>
                    <strong className="assignment-card__name">{assignment.userName}</strong>
                  </div>
                  <div className="assignment-card__chore-block">
                    <p className="assignment-card__chore-label">Chore</p>
                    <strong className="assignment-card__chore">{assignment.choreName}</strong>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              No assignments yet. Spin the wheel when the setup is ready.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default AssignmentsPanel
