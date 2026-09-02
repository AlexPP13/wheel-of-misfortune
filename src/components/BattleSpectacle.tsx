import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { User } from '../types/app'
import { playBattleSequence, playBattleSpectacle } from '../lib/battleAudio'

const PREPARE_DURATION_MS = 1500
const DECIDING_DURATION_MS = 5000
const SPECTACLE_DURATION_MS = 7200

type BattleSpectacleProps = {
  participants: User[]
  winner: User
  onComplete: () => void
}

function CartoonSword({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
    <path d="M61 8 79 56 66 70 49 20Z" fill="#e8f3f7" stroke="#2b3840" strokeWidth="5" strokeLinejoin="round" />
    <path d="m49 20 12-12 18 48-6 6Z" fill="#ffffff" opacity=".78" />
    <path d="m39 58 38 13 8-10-39-14Z" fill="#f6bd3d" stroke="#6b3c12" strokeWidth="5" strokeLinejoin="round" />
    <path d="m62 69 14 37-13 7-15-37Z" fill="#c84d32" stroke="#582317" strokeWidth="5" strokeLinejoin="round" />
    <path d="m58 104 17-7 5 11-19 8Z" fill="#f7ce5a" stroke="#6b3c12" strokeWidth="5" strokeLinejoin="round" />
  </svg>
}

function BattleSpectacle({ participants, winner, onComplete }: BattleSpectacleProps) {
  const [phase, setPhase] = useState<'locked' | 'deciding' | 'winner'>('locked')
  const rollingNames = useMemo(() => Array.from({ length: 12 }, (_, index) => participants[index % participants.length]?.name ?? ''), [participants])

  useEffect(() => {
    playBattleSequence()
    const decidingTimer = window.setTimeout(() => setPhase('deciding'), PREPARE_DURATION_MS)
    const winnerTimer = window.setTimeout(() => {
      setPhase('winner')
      playBattleSpectacle(`${winner.name} wins the history battle!`)
    }, DECIDING_DURATION_MS)
    const completeTimer = window.setTimeout(onComplete, SPECTACLE_DURATION_MS)

    return () => {
      window.clearTimeout(decidingTimer)
      window.clearTimeout(winnerTimer)
      window.clearTimeout(completeTimer)
    }
  }, [onComplete, winner.name])

  return createPortal(
    <div className={`battle-spectacle battle-spectacle--${phase}`} role="dialog" aria-modal="true" aria-live="assertive" aria-label="Battle in progress">
      <div className="battle-spectacle__grain" />
      <div className="battle-spectacle__content">
        {phase === 'locked' ? <>
          <p className="battle-spectacle__eyebrow">History battle · equal odds</p>
          <h2 className="battle-spectacle__title">Prepare to clash</h2>
          <p className="battle-spectacle__copy">{participants.map((participant) => participant.name).join(' · ')}</p>
          <div className="battle-spectacle__meter"><span /></div>
        </> : null}
        {phase === 'deciding' ? <>
          <p className="battle-spectacle__eyebrow">One winner takes all</p>
          <h2 className="battle-spectacle__title">Fight!</h2>
          <div className="battle-spectacle__swords" aria-hidden="true"><CartoonSword className="battle-spectacle__sword battle-spectacle__sword--left" /><CartoonSword className="battle-spectacle__sword battle-spectacle__sword--right" /></div>
          <div className="battle-spectacle__reel" aria-hidden="true">
            {rollingNames.map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}
          </div>
        </> : null}
        {phase === 'winner' ? <>
          <p className="battle-spectacle__eyebrow">Final strike · victory</p>
          <p className="battle-spectacle__crown" aria-hidden="true">✦</p>
          <h2 className="battle-spectacle__winner">{winner.name}</h2>
          <p className="battle-spectacle__copy">Takes every wagered history entry</p>
        </> : null}
      </div>
    </div>,
    document.body,
  )
}

export default BattleSpectacle
