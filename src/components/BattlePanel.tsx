import type { Assignment, AssignmentRow, Chore, User } from '../types/app'
import { panelMotion } from './panelMotion'
import { motion } from 'framer-motion'

export type BattleDisplayResult = {
  loserUserId: string
  transferredChoreIds: string[]
  winnerUserIds: string[]
}

type BattlePanelProps = {
  assignments: Assignment[]
  assignmentRows: AssignmentRow[]
  chores: Chore[]
  disabled?: boolean
  lastBattleResult?: BattleDisplayResult | null
  onRunBattle: () => void
  onToggleUser: (userId: string) => void
  selectedUserIds: string[]
  users: User[]
}

function BattlePanel({
  assignments,
  assignmentRows,
  chores,
  disabled = false,
  lastBattleResult,
  onRunBattle,
  onToggleUser,
  selectedUserIds,
  users,
}: BattlePanelProps) {
  const assignedUserIds = new Set(assignments.map((assignment) => assignment.userId))
  const eligibleUsers = users.filter((user) => assignedUserIds.has(user.id) && !user.disabled)
  const eligibleSelectedCount = eligibleUsers.filter((user) => selectedUserIds.includes(user.id)).length
  const canBattle = eligibleSelectedCount >= 2
  const loser = users.find((user) => user.id === lastBattleResult?.loserUserId)
  const winners = lastBattleResult?.winnerUserIds
    .map((userId) => users.find((user) => user.id === userId))
    .filter((user): user is User => Boolean(user)) ?? []
  const transferredChores = lastBattleResult?.transferredChoreIds
    .map((choreId) => chores.find((chore) => chore.id === choreId))
    .filter((chore): chore is Chore => Boolean(chore)) ?? []

  return (
    <motion.div className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Double or nothing</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">Random Battle</h2>
        </div>
        <span className="count-pill">{eligibleSelectedCount}/{eligibleUsers.length}</span>
      </div>

      <p className="max-w-2xl text-sm font-semibold leading-6 text-stone-700">
        Pick at least two assigned contestants. One selected contestant loses at random and inherits every task wagered by the other selected contestants.
      </p>

      {eligibleUsers.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eligibleUsers.map((user) => {
            const userAssignments = assignments.filter((assignment) => assignment.userId === user.id).length
            const isSelected = selectedUserIds.includes(user.id)

            return (
              <label
                key={user.id}
                className={[
                  'battle-contestant-card',
                  isSelected ? 'battle-contestant-card-selected' : '',
                  disabled ? 'battle-contestant-card-disabled' : '',
                ].filter(Boolean).join(' ')}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => onToggleUser(user.id)}
                />
                <span className="battle-contestant-card__copy">
                  <span className="battle-contestant-card__name">{user.name}</span>
                  <span className="battle-contestant-card__meta">{userAssignments} assigned task{userAssignments === 1 ? '' : 's'}</span>
                </span>
              </label>
            )
          })}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="dramatic-button" disabled={disabled || !canBattle} onClick={onRunBattle}>
          Start random battle
        </button>
        {!canBattle ? <p className="text-sm font-bold text-stone-700">Select at least two assigned users for battle.</p> : null}
      </div>

      {assignmentRows.length > 0 ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {assignmentRows.map((assignment) => (
            <div key={assignment.choreId} className="rounded-3xl border border-amber-900/10 bg-amber-50/55 p-4 shadow-inner">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-600">{assignment.userName}</p>
              <p className="mt-1 text-lg font-black text-stone-900">{assignment.choreName}</p>
            </div>
          ))}
        </div>
      ) : null}

      {lastBattleResult && loser ? (
        <div className="mt-6 rounded-3xl border border-amber-900/20 bg-amber-100/70 p-5 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-900/75">Battle result</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <p className="text-sm font-bold text-stone-800">Winners: <span className="text-stone-950">{winners.map((winner) => winner.name).join(', ')}</span></p>
            <p className="text-sm font-bold text-stone-800">Loser: <span className="text-stone-950">{loser.name}</span></p>
            <p className="text-sm font-bold text-stone-800">Transferred: <span className="text-stone-950">{transferredChores.map((chore) => chore.name).join(', ')}</span></p>
          </div>
          <p className="mt-3 text-lg font-black text-stone-900">
            🎲 {loser.name} lost the battle and inherited {transferredChores.length} wagered task{transferredChores.length === 1 ? '' : 's'}.
          </p>
        </div>
      ) : null}
    </motion.div>
  )
}

export default BattlePanel
