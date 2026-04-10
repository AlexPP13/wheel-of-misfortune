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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-200/65">Aftermath</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">This round</h2>
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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/44">Assigned doom</p>
                  <strong className="mt-2 block text-lg text-white">{assignment.choreName}</strong>
                </div>
                <div className="assignment-winner">{assignment.userName}</div>
              </motion.div>
            ))
          ) : (
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              No assignments yet. Press the big dramatic button.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default AssignmentsPanel
