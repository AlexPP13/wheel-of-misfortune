type NavigationItem = {
  badge: number
  id: NavigationView
  label: string
  ready: boolean
  step: number
}

export type NavigationView = 'users' | 'chores' | 'play' | 'battle' | 'fairness'

type NavigationTabsProps = {
  activeView: NavigationView
  disabled?: boolean
  items: NavigationItem[]
  onChange: (view: NavigationView) => void
  onResetEverything: () => void
}

function NavigationTabs({ activeView, disabled = false, items, onChange, onResetEverything }: NavigationTabsProps) {
  return (
    <nav className="glass-panel mb-4 p-2.5 sm:p-3" aria-label="App views">
      <div className="mb-2 flex items-center justify-between gap-4 px-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-stone-700/75">Setup flow</p>
          <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.03em] text-stone-900">Wheel wizard</h2>
        </div>
        <button
          type="button"
          className="dramatic-button dramatic-button-danger dramatic-button-small"
          onClick={onResetEverything}
          disabled={disabled}
        >
          Complete reset
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {items.map((item) => {
          const isActive = item.id === activeView

          return (
            <button
              key={item.id}
              type="button"
              className={['view-tab', isActive ? 'view-tab-active' : ''].filter(Boolean).join(' ')}
              onClick={() => onChange(item.id)}
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
