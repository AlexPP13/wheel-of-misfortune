import { useMemo, useState } from 'react'
import type { Chore, ChoreHistoryStats, User } from '../types/app'
import type { HistoryWager } from '../lib/app-state'
import { panelMotion } from './panelMotion'
import { motion } from 'framer-motion'

export type BattleDisplayResult = {
  winnerUserId: string
  loserUserIds: string[]
  transferredWagers: HistoryWager[]
}

type BattlePanelProps = {
  choreHistoryCounts: ChoreHistoryStats
  chores: Chore[]
  disabled?: boolean
  foughtUserIds: string[]
  lastBattleResult?: BattleDisplayResult | null
  onRunBattle: (wagers: HistoryWager[]) => void
  onToggleUser: (userId: string) => void
  selectedUserIds: string[]
  users: User[]
}

function formatTaskNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? 'these tasks'
  if (names.length === 2) return `${names[0]} or ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, or ${names[names.length - 1]}`
}

function BattlePanel({
  choreHistoryCounts,
  chores,
  disabled = false,
  foughtUserIds,
  lastBattleResult,
  onRunBattle,
  onToggleUser,
  selectedUserIds,
  users,
}: BattlePanelProps) {
  const [amounts, setAmounts] = useState<Record<string, number>>({})
  const eligibleUsers = users.filter((user) => !user.disabled && !foughtUserIds.includes(user.id))
  const contestants = users.filter((user) => selectedUserIds.includes(user.id))
  const chancePerContestant = contestants.length > 0 ? Math.round((100 / contestants.length) * 10) / 10 : 0
  const wagers = useMemo(() => contestants.flatMap((user) => chores.flatMap((chore) => {
    const amount = amounts[`${user.id}:${chore.id}`] ?? 0
    return amount > 0 ? [{ userId: user.id, choreId: chore.id, amount }] : []
  })), [amounts, chores, contestants])
  const hasWager = (userId: string) => wagers.some((wager) => wager.userId === userId)
  const canBattle = contestants.length >= 2 && contestants.every((user) => hasWager(user.id))
  const winner = users.find((user) => user.id === lastBattleResult?.winnerUserId)
  const losers = lastBattleResult?.loserUserIds
    .map((userId) => users.find((user) => user.id === userId))
    .filter((user): user is User => Boolean(user)) ?? []
  const capturedTaskNames = [...new Set(lastBattleResult?.transferredWagers
    .map((wager) => chores.find((chore) => chore.id === wager.choreId)?.name)
    .filter((name): name is string => Boolean(name)) ?? [])]

  const setWagerAmount = (userId: string, choreId: string, value: string, maximum: number) => {
    const amount = Math.max(0, Math.min(maximum, Number.parseInt(value, 10) || 0))
    setAmounts((current) => ({ ...current, [`${userId}:${choreId}`]: amount }))
  }

  const setAllIn = (userId: string) => {
    setAmounts((current) => ({
      ...current,
      ...Object.fromEntries(chores.map((chore) => [
        `${userId}:${chore.id}`,
        choreHistoryCounts[chore.id]?.[userId] ?? 0,
      ])),
    }))
  }

  const toggleContestant = (userId: string) => {
    onToggleUser(userId)
  }

  return (
    <motion.div className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Battle arena · equal odds</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">History Battle</h2>
        </div>
        <span className="count-pill whitespace-nowrap">{contestants.length > 0 ? `${contestants.length} chosen · ${chancePerContestant}% each` : 'Choose contestants'}</span>
      </div>

      <div className="border-t border-amber-900/15 pt-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-700/75">Contestants</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {eligibleUsers.map((user) => {
          const isSelected = selectedUserIds.includes(user.id)
          return (
            <motion.label key={user.id} className={['battle-contestant-card', isSelected ? 'battle-contestant-card-selected' : '', disabled ? 'battle-contestant-card-disabled' : ''].filter(Boolean).join(' ')} whileHover={disabled ? undefined : { scale: 1.02 }} whileTap={disabled ? undefined : { scale: 0.98 }}>
              <input type="checkbox" checked={isSelected} disabled={disabled} onChange={() => toggleContestant(user.id)} />
              <span className="battle-contestant-card__copy"><span className="battle-contestant-card__name">{user.name}</span><span className="battle-contestant-card__meta">{isSelected ? 'Ready to wager' : 'Available'}</span></span>
            </motion.label>
          )
        })}
      </div>

      {contestants.length >= 2 ? (
        <>
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-700/75">Wagers</p>
            <p className="text-xs font-semibold text-stone-600">Winner takes every other contestant’s selected history.</p>
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {contestants.map((user) => (
            <div key={user.id} className="rounded-2xl border border-amber-900/15 bg-white/45 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-black text-stone-900">{user.name}’s wager</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-stone-600">{hasWager(user.id) ? 'Set' : 'Not set'}</span>
                  <button type="button" className="battle-all-in-button" disabled={disabled || chores.every((chore) => (choreHistoryCounts[chore.id]?.[user.id] ?? 0) === 0)} onClick={() => setAllIn(user.id)}>All-in</button>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {chores.map((chore) => {
                  const available = choreHistoryCounts[chore.id]?.[user.id] ?? 0
                  const amount = amounts[`${user.id}:${chore.id}`] ?? 0
                  return <div key={chore.id} className="flex items-center justify-between gap-3 text-sm font-bold text-stone-700">
                    <span>{chore.name} <span className="text-stone-500">({available} available)</span></span>
                    <div className="battle-wager-stepper">
                      <button type="button" aria-label={`Decrease ${user.name} ${chore.name} wager`} disabled={disabled || amount === 0} onClick={() => setWagerAmount(user.id, chore.id, String(amount - 1), available)}>−</button>
                      <input aria-label={`${user.name} ${chore.name} wager`} className="battle-wager-stepper__input" type="text" inputMode="numeric" pattern="[0-9]*" value={amount} disabled={disabled || available === 0} onChange={(event) => setWagerAmount(user.id, chore.id, event.target.value, available)} />
                      <button type="button" aria-label={`Increase ${user.name} ${chore.name} wager`} disabled={disabled || amount >= available} onClick={() => setWagerAmount(user.id, chore.id, String(amount + 1), available)}>+</button>
                      <button type="button" className="battle-wager-stepper__max" disabled={disabled || available === 0 || amount === available} onClick={() => setWagerAmount(user.id, chore.id, String(available), available)}>Max</button>
                    </div>
                  </div>
                })}
              </div>
            </div>
          ))}
          </div>
        </>
      ) : <p className="mt-4 text-sm font-bold text-stone-700">Choose at least two contestants to open the wager board.</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" className="dramatic-button" disabled={disabled || !canBattle} onClick={() => onRunBattle(wagers)}>Roll battle</button>
        {!canBattle && contestants.length >= 2 ? <p className="text-sm font-bold text-stone-700">Set at least one task-history wager for each contestant.</p> : null}
      </div>
      </div>

      {lastBattleResult && winner && losers.length > 0 ? <motion.div className="battle-result-panel" initial={{ opacity: 0, scale: 0.92, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 16 }}>
        <div className="battle-result-panel__flare" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-900/75">Battle result</p>
        <p className="mt-3 text-sm font-bold text-stone-800"><span className="text-stone-950">{winner.name}</span> wins against {losers.map((loser) => loser.name).join(', ')}.</p>
        <p className="battle-result-panel__callout">{winner.name} has decreased their odds of being assigned {formatTaskNames(capturedTaskNames)}.</p>
      </motion.div> : null}
    </motion.div>
  )
}

export default BattlePanel
