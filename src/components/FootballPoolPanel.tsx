import { useMemo, useState } from 'react'

import { WORLD_CUP_2026_MATCHES } from '../data/world-cup-2026'
import { buildFootballLeaderboard, getFootballPoolDayWindow, isMatchInFootballPoolDay, scorePrediction } from '../lib/football-pool'
import type { FootballPrediction, FootballResult, User, WorldCupMatch } from '../types/app'
import { panelMotion } from './panelMotion'
import { motion } from 'framer-motion'

type FootballPoolPanelProps = {
  users: User[]
  predictions: FootballPrediction[]
  results: FootballResult[]
  onUpsertPrediction: (userId: string, matchId: string, homeScore: number, awayScore: number) => void
  onUpsertResult: (matchId: string, homeScore: number, awayScore: number) => void
}

function formatKickoff(kickoff: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(kickoff))
}

function parseScore(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  return Number(value)
}

function scoreValue(value: number | undefined) {
  return typeof value === 'number' ? String(value) : ''
}

function formatWindowDate(date: Date) {
  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function FootballPoolPanel({
  users,
  predictions,
  results,
  onUpsertPrediction,
  onUpsertResult,
}: FootballPoolPanelProps) {
  const activeUsers = useMemo(() => users.filter((user) => !user.disabled), [users])
  const [selectedUserId, setSelectedUserId] = useState(activeUsers[0]?.id ?? '')
  const [resultsMode, setResultsMode] = useState(false)
  const effectiveSelectedUserId = activeUsers.some((user) => user.id === selectedUserId)
    ? selectedUserId
    : (activeUsers[0]?.id ?? '')

  const leaderboard = useMemo(
    () => buildFootballLeaderboard(activeUsers, predictions, results, WORLD_CUP_2026_MATCHES),
    [activeUsers, predictions, results],
  )
  const now = new Date()
  const poolWindow = getFootballPoolDayWindow(now)
  const visibleMatches = WORLD_CUP_2026_MATCHES.filter((match) => isMatchInFootballPoolDay(match, now))
  const predictionsByMatch = new Map(
    predictions
      .filter((prediction) => prediction.userId === effectiveSelectedUserId)
      .map((prediction) => [prediction.matchId, prediction]),
  )
  const resultsByMatch = new Map(results.map((result) => [result.matchId, result]))
  const groupedMatches = visibleMatches.reduce<Record<string, WorldCupMatch[]>>((groups, match) => {
    const key = match.stage === 'Group stage' ? `${match.stage} · Groep ${match.group}` : match.stage
    groups[key] = [...(groups[key] ?? []), match]
    return groups
  }, {})

  const savePredictionPart = (match: WorldCupMatch, side: 'home' | 'away', value: string) => {
    const score = parseScore(value)
    const current = predictionsByMatch.get(match.id)

    if (score === null || !effectiveSelectedUserId || new Date(match.kickoff) <= new Date()) {
      return
    }

    onUpsertPrediction(
      effectiveSelectedUserId,
      match.id,
      side === 'home' ? score : (current?.homeScore ?? 0),
      side === 'away' ? score : (current?.awayScore ?? 0),
    )
  }

  const saveResultPart = (match: WorldCupMatch, side: 'home' | 'away', value: string) => {
    const score = parseScore(value)
    const current = resultsByMatch.get(match.id)

    if (score === null) {
      return
    }

    onUpsertResult(match.id, side === 'home' ? score : (current?.homeScore ?? 0), side === 'away' ? score : (current?.awayScore ?? 0))
  }

  if (users.length === 0) {
    return (
      <motion.section className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">WK 2026 Pool</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">WK 2026 Voetbalpool</h2>
        <div className="empty-state mt-5">Voeg eerst spelers toe bij Users. Daarna kan iedereen zijn voorspelling invullen.</div>
      </motion.section>
    )
  }

  return (
    <motion.section className="grid gap-6 xl:grid-cols-[0.8fr_1.4fr]" initial="hidden" animate="visible" variants={panelMotion}>
      <aside className="glass-panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Klassement</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">WK 2026 Voetbalpool</h2>
          </div>
          <span className="count-pill">{WORLD_CUP_2026_MATCHES.length}</span>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.24em] text-stone-700/75">Voorspeller</span>
          <select
            className="dramatic-input w-full"
            value={effectiveSelectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            disabled={activeUsers.length === 0}
          >
            {activeUsers.length > 0 ? (
              activeUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))
            ) : (
              <option value="">Alle spelers zijn uitgeschakeld</option>
            )}
          </select>
        </label>

        <button
          type="button"
          className={['dramatic-button w-full', resultsMode ? 'dramatic-button-danger' : 'dramatic-button-muted'].join(' ')}
          onClick={() => setResultsMode((current) => !current)}
        >
          {resultsMode ? 'Uitslagenmodus aan' : 'Uitslagenmodus uit'}
        </button>

        <div className="mt-5 space-y-3">
          {leaderboard.map((row, index) => (
            <div key={row.userId} className="leader-row flex-col items-stretch gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-stone-900">
                    #{index + 1} {row.userName}
                  </p>
                  <p className="text-sm text-stone-700/80">
                    {row.exactScores} exact · {row.correctOutcomes} uitkomst · {row.predictionsSubmitted} voorspellingen
                  </p>
                </div>
                <span className="count-pill">{row.totalPoints} pt</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="glass-panel p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Voorspelling</p>
          <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">Wedstrijden</h3>
          <p className="mt-1 text-sm font-semibold text-stone-700/80">
            Vandaag open: {formatWindowDate(poolWindow.start)} tot {formatWindowDate(poolWindow.end)}. Ook nachtwedstrijden zoals 02:00 horen bij deze speeldag.
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-700/80">Vergrendeld na aftrap. Uitslag is lokaal en zichtbaar voor iedereen op dit apparaat.</p>
        </div>

        <div className="space-y-6">
          {visibleMatches.length === 0 ? (
            <div className="empty-state">Geen WK-wedstrijden in het huidige 09:00-tot-09:00 venster.</div>
          ) : null}
          {Object.entries(groupedMatches).map(([groupName, matches]) => (
            <section key={groupName} className="space-y-3">
              <h4 className="rounded-full border border-[#785328] bg-[#f0ddb4] px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-[#4a2f17]">
                {groupName}
              </h4>
              {matches.map((match) => {
                const prediction = predictionsByMatch.get(match.id)
                const result = resultsByMatch.get(match.id)
                const locked = new Date(match.kickoff) <= new Date()
                const earned = prediction && result ? scorePrediction(prediction, result) : null

                return (
                  <article key={match.id} className="rounded-[1.25rem] border border-[#7d582b] bg-[#f0ddb6] p-4 shadow-sm">
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-700/75">
                          Match {match.matchNumber} · {formatKickoff(match.kickoff)} · {match.venue}
                        </p>
                        <div className="mt-2 grid gap-2 text-lg font-black text-stone-900 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                          <span>{match.homeTeam}</span>
                          <span className="text-sm uppercase tracking-[0.2em] text-stone-700/70">vs</span>
                          <span>{match.awayTeam}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
                        {locked ? <span className="count-pill">Vergrendeld</span> : <span className="count-pill">Open</span>}
                        {earned ? <span className="count-pill">{earned.points} pt</span> : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1rem] border border-[#8f6c3b] bg-[#ead3a7] p-3">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-stone-700/75">Voorspelling</p>
                        <div className="grid grid-cols-[1fr_1fr] gap-2">
                          <input
                            className="dramatic-input min-w-0"
                            type="number"
                            min="0"
                            step="1"
                            aria-label={`Voorspelling ${match.homeTeam}`}
                            value={scoreValue(prediction?.homeScore)}
                            disabled={locked || !effectiveSelectedUserId}
                            onChange={(event) => savePredictionPart(match, 'home', event.target.value)}
                          />
                          <input
                            className="dramatic-input min-w-0"
                            type="number"
                            min="0"
                            step="1"
                            aria-label={`Voorspelling ${match.awayTeam}`}
                            value={scoreValue(prediction?.awayScore)}
                            disabled={locked || !effectiveSelectedUserId}
                            onChange={(event) => savePredictionPart(match, 'away', event.target.value)}
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-stone-700/80">{locked ? 'Vergrendeld na aftrap' : 'Slaat direct lokaal op'}</p>
                      </div>

                      <div className="rounded-[1rem] border border-[#8d4930] bg-[#e7bea5] p-3">
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-stone-700/75">Uitslag</p>
                        <div className="grid grid-cols-[1fr_1fr] gap-2">
                          <input
                            className="dramatic-input min-w-0"
                            type="number"
                            min="0"
                            step="1"
                            aria-label={`Uitslag ${match.homeTeam}`}
                            value={scoreValue(result?.homeScore)}
                            disabled={!resultsMode}
                            onChange={(event) => saveResultPart(match, 'home', event.target.value)}
                          />
                          <input
                            className="dramatic-input min-w-0"
                            type="number"
                            min="0"
                            step="1"
                            aria-label={`Uitslag ${match.awayTeam}`}
                            value={scoreValue(result?.awayScore)}
                            disabled={!resultsMode}
                            onChange={(event) => saveResultPart(match, 'away', event.target.value)}
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-stone-700/80">Werkelijke score, niet de voorspelling.</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>
          ))}
        </div>
      </div>
    </motion.section>
  )
}

export default FootballPoolPanel
