import type { ResultSoundPreference } from '../types/app'
import { panelMotion } from './panelMotion'
import { motion } from 'framer-motion'

type SoundOption = {
  description: string
  label: string
  value: ResultSoundPreference
}

const soundOptions: SoundOption[] = [
  { value: 'random', label: 'Random each spin', description: 'Draw a different result sound for every chore assignment.' },
  { value: 'fruit-machine', label: 'Fruit-machine win', description: 'A short, upbeat electronic major-chord arpeggio.' },
  { value: 'jackpot-fanfare', label: 'Jackpot fanfare', description: 'A larger, longer celebration for a big result.' },
  { value: 'arcade-cheer', label: 'Arcade cheer', description: 'A stylized amusement-park crowd burst.' },
]

type SettingsPanelProps = {
  disabled?: boolean
  onResetEverything: () => void
  onPreviewResultSound: (preference: Exclude<ResultSoundPreference, 'random'>) => void
  onResultSoundPreferenceChange: (preference: ResultSoundPreference) => void
  previewingResultSound: Exclude<ResultSoundPreference, 'random'> | null
  resultSoundPreference: ResultSoundPreference
}

function SettingsPanel({
  disabled = false,
  onPreviewResultSound,
  onResetEverything,
  onResultSoundPreferenceChange,
  previewingResultSound,
  resultSoundPreference,
}: SettingsPanelProps) {
  return (
    <motion.section className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Arena configuration</p>
      <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">Result sound</h2>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-stone-700">
        Choose the sound that plays when the wheel assigns a chore. Changes are saved automatically.
      </p>

      <fieldset className="mt-6" disabled={disabled}>
        <legend className="text-sm font-black uppercase tracking-[0.12em] text-stone-900">Choose a result sound</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {soundOptions.map((option) => {
            const isSelected = option.value === resultSoundPreference
            const descriptionId = `result-sound-${option.value}-description`
            const inputId = `result-sound-${option.value}`
            const previewSound = option.value === 'random' ? null : option.value
            const isPreviewing = previewSound === previewingResultSound

            return (
              <div
                key={option.value}
                className={[
                  'relative rounded-[1.2rem] border border-[#8f6a3a] bg-[#f0ddb6] p-4 pr-12 transition',
                  isSelected || isPreviewing ? 'border-[#a86d1d] bg-[#ecd08a]' : '',
                  disabled ? 'cursor-not-allowed opacity-55' : '',
                ].filter(Boolean).join(' ')}
              >
                <label htmlFor={inputId} className="flex cursor-pointer gap-3">
                  <input
                    id={inputId}
                    type="radio"
                    name="result-sound"
                    value={option.value}
                    checked={isSelected}
                    disabled={disabled}
                    aria-label={option.label}
                    aria-describedby={descriptionId}
                    onChange={() => onResultSoundPreferenceChange(option.value)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#a87422]"
                  />
                  <span>
                    <span className="block text-base font-black uppercase tracking-[0.04em] text-stone-900">{option.label}</span>
                    <span id={descriptionId} className="mt-1 block text-sm leading-5 text-stone-700">{option.description}</span>
                  </span>
                </label>
                {previewSound && (
                  <button
                    type="button"
                    className={['assignment-card__switch-icon absolute right-3 top-3', isPreviewing ? 'ring-2 ring-[#f8e9c5] ring-offset-2 ring-offset-[#ecd08a]' : ''].filter(Boolean).join(' ')}
                    disabled={disabled}
                    onClick={() => onPreviewResultSound(previewSound)}
                    aria-label={isPreviewing ? `Playing ${option.label}` : `Preview ${option.label}`}
                    aria-pressed={isPreviewing}
                    title={isPreviewing ? `Playing ${option.label}` : `Preview ${option.label}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                      <path className="fill-current" d="M4 9v6h4l5 4V5L8 9H4Z" />
                      {isPreviewing && (
                        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
                          <path className="animate-pulse" d="M16 10a3 3 0 0 1 0 4" />
                          <path className="animate-pulse" style={{ animationDelay: '120ms' }} d="M18 7.5a6.5 6.5 0 0 1 0 9" />
                          <path className="animate-pulse" style={{ animationDelay: '240ms' }} d="M20 5a10 10 0 0 1 0 14" />
                        </g>
                      )}
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#8f6a3a]/40 pt-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-stone-900">Danger zone</h3>
          <p className="mt-1 text-sm text-stone-700">Remove every user, chore, assignment, and history record.</p>
        </div>
        <button
          type="button"
          className="dramatic-button dramatic-button-danger dramatic-button-small"
          disabled={disabled}
          onClick={onResetEverything}
        >
          Complete reset
        </button>
      </div>
    </motion.section>
  )
}

export default SettingsPanel
