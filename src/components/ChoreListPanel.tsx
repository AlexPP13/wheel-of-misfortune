import { AnimatePresence, motion } from 'framer-motion'
import type { FormEvent } from 'react'

import type { Chore } from '../types/app'

type ChoreListPanelProps = {
  assignmentsChoreIds: Set<string>
  chores: Chore[]
  disabled?: boolean
  onInputChange: (value: string) => void
  onRemove: (id: string) => void
  onToggleDisabled: (id: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  value: string
}

function ChoreListPanel({
  assignmentsChoreIds,
  chores,
  disabled = false,
  onInputChange,
  onRemove,
  onToggleDisabled,
  onSubmit,
  value,
}: ChoreListPanelProps) {
  return (
    <div className="glass-panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/70">Wheel queue</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">Chores</h2>
        </div>
        <span className="count-pill">{chores.length}</span>
      </div>

      <form className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={onSubmit}>
        <input
          className="dramatic-input"
          value={value}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="Add a catastrophe"
          aria-label="Chore name"
        />
        <button type="submit" className="dramatic-button dramatic-button-emerald">
          Add
        </button>
      </form>

      <div className="space-y-3">
        <AnimatePresence>
          {chores.map((chore) => {
            const isAssigned = assignmentsChoreIds.has(chore.id)
            const statusText = chore.disabled
              ? 'Disabled for this round'
              : isAssigned
                ? 'Assigned this round'
                : 'Waiting on the wheel'

            return (
              <motion.div
                key={chore.id}
                className={['list-card', isAssigned ? 'list-card-success' : '', chore.disabled ? 'list-card-disabled' : '']
                  .filter(Boolean)
                  .join(' ')}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div>
                  <strong className="text-stone-900">{chore.name}</strong>
                  <span className="mt-1 block text-sm text-stone-700/80">{statusText}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="dramatic-button dramatic-button-muted dramatic-button-small"
                    onClick={() => onToggleDisabled(chore.id)}
                    disabled={disabled}
                  >
                    {chore.disabled ? 'Enable' : 'Disable'}
                  </button>
                  <button
                    type="button"
                    className="dramatic-button dramatic-button-danger dramatic-button-small"
                    onClick={() => onRemove(chore.id)}
                    disabled={disabled}
                  >
                    Remove
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ChoreListPanel
