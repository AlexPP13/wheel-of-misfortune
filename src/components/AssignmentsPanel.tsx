import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import type { AssignmentRow, User } from '../types/app'
import { panelMotion } from './panelMotion'

type AssignmentsPanelProps = {
  assignmentRows: AssignmentRow[]
  disabled?: boolean
  onSwitchAssignment?: (choreId: string, fromUserId: string, toUserId: string) => void
  users?: User[]
}

function AssignmentsPanel({ assignmentRows, disabled = false, onSwitchAssignment, users = [] }: AssignmentsPanelProps) {
  const [switchingChoreId, setSwitchingChoreId] = useState<string | null>(null)

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
            assignmentRows.map((assignment, index) => {
              const eligibleTargets = users.filter((user) => user.id !== assignment.userId && !user.disabled)
              const canSwitch = Boolean(onSwitchAssignment) && eligibleTargets.length > 0
              const isSwitching = switchingChoreId === assignment.choreId

              return (
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
                      <div className="assignment-card__chore-head">
                        <p className="assignment-card__chore-label">Chore</p>
                        {onSwitchAssignment && !isSwitching ? (
                          <button
                            type="button"
                            className="assignment-card__switch-icon"
                            aria-label={`Switch ${assignment.choreName} to another user`}
                            disabled={disabled || !canSwitch}
                            title={canSwitch ? 'Switch task' : 'No eligible users to switch to'}
                            onClick={() => setSwitchingChoreId(assignment.choreId)}
                          >
                            ⇄
                          </button>
                        ) : null}
                      </div>
                      {onSwitchAssignment && isSwitching ? (
                        <div className="assignment-card__switch">
                          <label className="assignment-card__switch-picker">
                            <span>Switch to</span>
                            <select
                              className="assignment-card__switch-select"
                              aria-label={`Switch ${assignment.choreName} target user`}
                              disabled={disabled}
                              defaultValue=""
                              onChange={(event) => {
                                const toUserId = event.target.value

                                if (!toUserId) return

                                onSwitchAssignment(assignment.choreId, assignment.userId, toUserId)
                                setSwitchingChoreId(null)
                              }}
                            >
                              <option value="" disabled>
                                Pick user...
                              </option>
                              {eligibleTargets.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : (
                        <strong className="assignment-card__chore">{assignment.choreName}</strong>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
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
