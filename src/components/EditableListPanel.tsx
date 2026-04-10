import { AnimatePresence, motion } from 'framer-motion'
import type { FormEvent } from 'react'

type EditableItem = {
  id: string
  name: string
  meta: string
  highlighted?: boolean
}

type EditableListPanelProps = {
  buttonLabel: string
  count: number
  inputLabel: string
  inputPlaceholder: string
  items: EditableItem[]
  onInputChange: (value: string) => void
  onRemove: (id: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  panelLabel: string
  title: string
  value: string
  disabled?: boolean
  tone?: 'fuchsia' | 'orange'
}

function EditableListPanel({
  buttonLabel,
  count,
  disabled = false,
  inputLabel,
  inputPlaceholder,
  items,
  onInputChange,
  onRemove,
  onSubmit,
  panelLabel,
  title,
  tone = 'fuchsia',
  value,
}: EditableListPanelProps) {
  const labelClass = tone === 'orange' ? 'text-amber-800/70' : 'text-stone-700/75'

  return (
    <div className="glass-panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${labelClass}`}>{panelLabel}</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">{title}</h2>
        </div>
        <span className="count-pill">{count}</span>
      </div>

      <form className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={onSubmit}>
        <input
          className="dramatic-input"
          value={value}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={inputPlaceholder}
          aria-label={inputLabel}
        />
        <button type="submit" className="dramatic-button dramatic-button-emerald">
          {buttonLabel}
        </button>
      </form>

      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              className={['list-card', item.highlighted ? 'list-card-active' : ''].filter(Boolean).join(' ')}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div>
                <strong className="text-stone-900">{item.name}</strong>
                <span className="mt-1 block text-sm text-stone-700/80">{item.meta}</span>
              </div>
              <button
                type="button"
                className="dramatic-button dramatic-button-danger dramatic-button-small"
                onClick={() => onRemove(item.id)}
                disabled={disabled}
              >
                Remove
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default EditableListPanel
