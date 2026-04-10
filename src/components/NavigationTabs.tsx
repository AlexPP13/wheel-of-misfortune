type NavigationItem = {
  badge: number
  caption: string
  id: string
  label: string
  ready: boolean
  step: number
}

type NavigationTabsProps = {
  activeView: 'play' | 'chores' | 'users'
  items: NavigationItem[]
  onChange: (view: 'play' | 'chores' | 'users') => void
}

function NavigationTabs({ activeView, items, onChange }: NavigationTabsProps) {
  return (
    <nav className="glass-panel mb-6 p-3 sm:p-4" aria-label="Wizard steps">
      <div className="mb-4 flex items-center justify-between gap-4 px-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/52">Setup flow</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">Wheel wizard</h2>
        </div>
        <p className="max-w-sm text-right text-sm text-white/60">
          Follow the steps in order, or jump back to edit any part of the round.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const isActive = item.id === activeView

          return (
            <button
              key={item.id}
              type="button"
              className={['view-tab', isActive ? 'view-tab-active' : ''].filter(Boolean).join(' ')}
              onClick={() => onChange(item.id as 'play' | 'chores' | 'users')}
              aria-pressed={isActive}
            >
              <span className="view-tab__copy">
                <span className="view-tab__meta">
                  <span className="view-tab__step">Step {item.step}</span>
                  <span className={['view-tab__status', item.ready ? 'view-tab__status-ready' : ''].filter(Boolean).join(' ')}>
                    {item.ready ? 'Ready' : 'Needs setup'}
                  </span>
                </span>
                <span className="view-tab__label">{item.label}</span>
                <span className="view-tab__caption">{item.caption}</span>
              </span>
              <span className="view-tab__badge">{item.badge}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default NavigationTabs
