import type { Assignment, AssignmentRow, Chore, User } from '../types/app'
import { panelMotion } from './panelMotion'
import { motion } from 'framer-motion'

export type BattleDisplayResult = {
  winnerUserId: string
  loserUserId: string
  transferredChoreId: string
  keptChoreId: string
}

type BattlePanelProps = {
  assignments: Assignment[]
  assignmentRows: AssignmentRow[]
  chores: Chore[]
  disabled?: boolean
  lastBattleResult?: BattleDisplayResult | null
  onRunBattle: () => void
  users: User[]
}

function BattlePanel({
  assignments,
  assignmentRows,
  chores,
  disabled = false,
  lastBattleResult,
  onRunBattle,
  users,
}: BattlePanelProps) {
  const assignedUserIds = new Set(assignments.map((assignment) => assignment.userId))
  const eligibleUsers = users.filter((user) => assignedUserIds.has(user.id) && !user.disabled)
  const canBattle = eligibleUsers.length >= 2
  const winner = users.find((user) => user.id === lastBattleResult?.winnerUserId)
  const loser = users.find((user) => user.id === lastBattleResult?.loserUserId)
  const transferredChore = chores.find((chore) => chore.id === lastBattleResult?.transferredChoreId)
  const keptChore = chores.find((chore) => chore.id === lastBattleResult?.keptChoreId)

  return (
    <motion.div className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Double or nothing</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">Random Battle</h2>
        </div>
        <span className="count-pill">{eligibleUsers.length}</span>
      </div>

      <p className="max-w-2xl text-sm font-semibold leading-6 text-stone-700">
        Two unlucky contestants are picked at random. One loses. The loser gets both selected tasks.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="dramatic-button" disabled={disabled || !canBattle} onClick={onRunBattle}>
          Start random battle
        </button>
        {!canBattle ? <p className="text-sm font-bold text-stone-700">At least two assigned users are needed for battle.</p> : null}
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

      {lastBattleResult && winner && loser && transferredChore ? (
        <div className="mt-6 rounded-3xl border border-amber-900/20 bg-amber-100/70 p-5 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-900/75">Battle result</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <p className="text-sm font-bold text-stone-800">Winner: <span className="text-stone-950">{winner.name}</span></p>
            <p className="text-sm font-bold text-stone-800">Loser: <span className="text-stone-950">{loser.name}</span></p>
            <p className="text-sm font-bold text-stone-800">Transferred: <span className="text-stone-950">{transferredChore.name}</span></p>
          </div>
          <p className="mt-3 text-lg font-black text-stone-900">
            🎲 {loser.name} lost the battle and inherited {transferredChore.name}.
            {keptChore ? ` They kept ${keptChore.name}, too.` : ''}
          </p>
        </div>
      ) : null}
    </motion.div>
  )
}

export default BattlePanel
