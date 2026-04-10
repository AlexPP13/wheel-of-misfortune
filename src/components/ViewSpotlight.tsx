type SpotlightStat = {
  label: string
  value: string | number
}

type SpotlightAction = {
  label: string
  onClick: () => void
  tone?: 'primary' | 'muted'
}

type ViewSpotlightProps = {
  actions?: SpotlightAction[]
  description: string
  eyebrow: string
  stats: SpotlightStat[]
  title: string
}

function ViewSpotlight({ actions = [], description, eyebrow, stats, title }: ViewSpotlightProps) {
  return (
    <section className="glass-panel p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-800/75">{eyebrow}</p>
      <h2 className="mt-3 max-w-xl text-3xl font-black uppercase tracking-[-0.03em] text-stone-900">{title}</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-700/85 sm:text-base">{description}</p>

      {actions.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={[
                'dramatic-button',
                action.tone === 'primary' ? 'dramatic-button-primary' : 'dramatic-button-muted',
              ].join(' ')}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="score-tile">
            <span>{stat.label}</span>
            <strong className="text-2xl sm:text-3xl">{stat.value}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ViewSpotlight
