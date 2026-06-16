import { useEffect, useMemo, useState } from 'react'

import { WORLD_CUP_2026_MATCHES } from '../data/world-cup-2026'
import {
  buildFootballLeaderboard,
  getLocalDateKey,
  getMatchDateKeys,
  isMatchOnDate,
  scorePrediction,
} from '../lib/football-pool'
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

type FifaApiMatch = {
  AwayTeamScore: number | null
  HomeTeamScore: number | null
  MatchNumber: number
  MatchStatus: number
  MatchTime: string | null
}

const FIFA_RESULTS_URL =
  'https://api.fifa.com/api/v3/calendar/matches?language=en&count=200&idCompetition=17&idSeason=285023'

function formatKickoff(kickoff: string) {
  return new Intl.DateTimeFormat('en-GB', {
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

function getMatchStatus(kickoff: string, now: Date, apiMatch: FifaApiMatch | undefined) {
  if (apiMatch?.MatchStatus === 0 && typeof apiMatch.HomeTeamScore === 'number' && typeof apiMatch.AwayTeamScore === 'number') {
    return { label: 'Finished', minute: null, started: true }
  }

  if (apiMatch?.MatchTime && apiMatch.MatchStatus !== 1) {
    return { label: 'Live', minute: apiMatch.MatchTime.replace("'", ''), started: true }
  }

  const elapsedMinutes = Math.floor((now.getTime() - new Date(kickoff).getTime()) / 60000)

  if (elapsedMinutes < 0) {
    return { label: 'Upcoming', minute: null, started: false }
  }

  if (elapsedMinutes >= 120) {
    return { label: 'Finished', minute: null, started: true }
  }

  return { label: 'Live', minute: String(Math.min(elapsedMinutes + 1, 90)), started: true }
}

function formatDateKey(dateKey: string) {
  const date = dateKeyToDate(dateKey)

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function dateKeyToDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(dateKeyToDate(`${monthKey}-01`))
}

function addMonths(monthKey: string, offset: number) {
  const date = dateKeyToDate(`${monthKey}-01`)
  date.setMonth(date.getMonth() + offset)
  return getMonthKey(date)
}

function getCalendarDays(monthKey: string) {
  const firstDay = dateKeyToDate(`${monthKey}-01`)
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate()
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7

  return [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1
      return `${monthKey}-${String(day).padStart(2, '0')}`
    }),
  ]
}

function getDefaultMatchDateKey() {
  return getLocalDateKey(new Date())
}

function FootballPoolPanel({
  users,
  predictions,
  results,
  onUpsertPrediction,
  onUpsertResult,
}: FootballPoolPanelProps) {
  const activeUsers = useMemo(() => users.filter((user) => !user.disabled), [users])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [liveTime, setLiveTime] = useState(() => new Date())
  const [fifaApiMatches, setFifaApiMatches] = useState<FifaApiMatch[]>([])
  const [resultsError, setResultsError] = useState<string | null>(null)
  const selectedUser = activeUsers.find((user) => user.id === selectedUserId) ?? null

  useEffect(() => {
    const intervalId = window.setInterval(() => setLiveTime(new Date()), 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchResults() {
      try {
        const response = await fetch(FIFA_RESULTS_URL, { signal: controller.signal })

        if (!response.ok) {
          throw new Error(`FIFA results request failed: ${response.status}`)
        }

        const data = (await response.json()) as { Results?: FifaApiMatch[] }
        setFifaApiMatches(Array.isArray(data.Results) ? data.Results : [])
        setResultsError(null)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setResultsError('Could not refresh FIFA results right now.')
      }
    }

    void fetchResults()
    const intervalId = window.setInterval(() => void fetchResults(), 60000)

    return () => {
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const leaderboard = useMemo(
    () => buildFootballLeaderboard(activeUsers, predictions, results, WORLD_CUP_2026_MATCHES),
    [activeUsers, predictions, results],
  )
  const matchDateKeys = useMemo(() => getMatchDateKeys(WORLD_CUP_2026_MATCHES), [])
  const todayKey = getLocalDateKey(liveTime)
  const fallbackDateKey = todayKey
  const [selectedDateKey, setSelectedDateKey] = useState(() => getDefaultMatchDateKey())
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => getMonthKey(dateKeyToDate(getDefaultMatchDateKey())))
  const effectiveDateKey = selectedDateKey || fallbackDateKey
  const nowTime = liveTime.getTime()
  const visibleMatches = WORLD_CUP_2026_MATCHES.filter((match) => isMatchOnDate(match, effectiveDateKey))
  const visibleMatchIds = new Set(visibleMatches.map((match) => match.id))
  const fifaApiMatchesByNumber = new Map(fifaApiMatches.map((match) => [match.MatchNumber, match]))
  const matchDateCounts = new Map(
    matchDateKeys.map((dateKey) => [dateKey, WORLD_CUP_2026_MATCHES.filter((match) => isMatchOnDate(match, dateKey)).length]),
  )
  const currentMonthKey = getMonthKey(dateKeyToDate(todayKey))
  const firstMatchMonthKey = getMonthKey(dateKeyToDate(matchDateKeys[0]))
  const lastMatchMonthKey = getMonthKey(dateKeyToDate(matchDateKeys[matchDateKeys.length - 1]))
  const minMonthKey = firstMatchMonthKey < currentMonthKey ? firstMatchMonthKey : currentMonthKey
  const maxMonthKey = lastMatchMonthKey > currentMonthKey ? lastMatchMonthKey : currentMonthKey
  const canGoPreviousMonth = calendarMonthKey > minMonthKey
  const canGoNextMonth = calendarMonthKey < maxMonthKey
  const predictionsByMatch = useMemo(
    () =>
      new Map(
        predictions
          .filter((prediction) => prediction.userId === selectedUser?.id)
          .map((prediction) => [prediction.matchId, prediction]),
      ),
    [predictions, selectedUser?.id],
  )
  const dailyPredictionCounts = new Map<string, number>()

  for (const prediction of predictions) {
    if (visibleMatchIds.has(prediction.matchId)) {
      dailyPredictionCounts.set(prediction.userId, (dailyPredictionCounts.get(prediction.userId) ?? 0) + 1)
    }
  }

  const resultsByMatch = useMemo(() => new Map(results.map((result) => [result.matchId, result])), [results])

  useEffect(() => {
    for (const match of fifaApiMatches) {
      if (typeof match.HomeTeamScore !== 'number' || typeof match.AwayTeamScore !== 'number') {
        continue
      }

      const matchId = `wc2026-${match.MatchNumber}`
      const current = resultsByMatch.get(matchId)

      if (current?.homeScore === match.HomeTeamScore && current.awayScore === match.AwayTeamScore) {
        continue
      }

      onUpsertResult(matchId, match.HomeTeamScore, match.AwayTeamScore)
    }
  }, [fifaApiMatches, onUpsertResult, resultsByMatch])

  const groupedMatches = visibleMatches.reduce<Record<string, WorldCupMatch[]>>((groups, match) => {
    const key = match.stage === 'Group stage' ? `${match.stage} · Groep ${match.group}` : match.stage
    groups[key] = [...(groups[key] ?? []), match]
    return groups
  }, {})
  const savePredictionPart = (match: WorldCupMatch, side: 'home' | 'away', value: string) => {
    const score = parseScore(value)
    const current = predictionsByMatch.get(match.id)

    if (score === null || !selectedUser || new Date(match.kickoff).getTime() <= nowTime) {
      return
    }

    onUpsertPrediction(
      selectedUser.id,
      match.id,
      side === 'home' ? score : (current?.homeScore ?? 0),
      side === 'away' ? score : (current?.awayScore ?? 0),
    )
  }

  const changeDate = (dateKey: string) => {
    if (matchDateKeys.includes(dateKey) || dateKey === todayKey) {
      setSelectedDateKey(dateKey)
      setCalendarMonthKey(getMonthKey(dateKeyToDate(dateKey)))
    }
  }

  if (users.length === 0) {
    return (
      <motion.section className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">WK 2026 Pool</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">World Cup 2026 Pool</h2>
        <div className="empty-state mt-5">Add users first. Then everyone can enter predictions.</div>
      </motion.section>
    )
  }

  return (
    <motion.section className="grid gap-6 xl:grid-cols-[0.85fr_1.35fr]" initial="hidden" animate="visible" variants={panelMotion}>
      <aside className="glass-panel p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Daily picks</p>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">World Cup 2026 Pool</h2>
          </div>
          <span className="count-pill">{visibleMatches.length}</span>
        </div>

        <p className="mb-4 text-sm font-semibold text-stone-700/80">
          Choose a match date and player. The cards show who still needs to submit picks for that date.
        </p>

        <div className="mb-5 rounded-[1rem] border border-[#8f6c3b] bg-[#ead3a7] p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-stone-700/75">Match date</p>
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="dramatic-button dramatic-button-muted dramatic-button-small"
              disabled={!canGoPreviousMonth}
              onClick={() => setCalendarMonthKey((current) => addMonths(current, -1))}
            >
              Prev
            </button>
            <strong className="text-sm font-black uppercase tracking-[0.18em] text-stone-900">{getMonthLabel(calendarMonthKey)}</strong>
            <button
              type="button"
              className="dramatic-button dramatic-button-muted dramatic-button-small"
              disabled={!canGoNextMonth}
              onClick={() => setCalendarMonthKey((current) => addMonths(current, 1))}
            >
              Next
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-black uppercase tracking-[0.12em] text-stone-700/70">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {getCalendarDays(calendarMonthKey).map((dateKey, index) => {
              if (!dateKey) {
                return <span key={`empty-${index}`} />
              }

              const matchCount = matchDateCounts.get(dateKey) ?? 0
              const hasMatches = matchCount > 0
              const active = dateKey === effectiveDateKey
              const canSelect = hasMatches || dateKey === todayKey
              const dayNumber = Number(dateKey.slice(-2))

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={[
                    'rounded-xl border px-1 py-2 text-sm font-black transition',
                    active ? 'border-[#7b6f2d] bg-[#d7d39d] text-[#2f2a11]' : 'border-[#8f6c3b] bg-[#f2e1bd] text-stone-900',
                    canSelect ? 'enabled:hover:-translate-y-0.5' : 'cursor-not-allowed opacity-35',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={!canSelect}
                  onClick={() => changeDate(dateKey)}
                  aria-label={hasMatches ? `${formatDateKey(dateKey)}, ${matchCount} matches` : `${formatDateKey(dateKey)}, no matches`}
                  aria-pressed={active}
                >
                  <span className="block">{dayNumber}</span>
                  {hasMatches ? <span className="mt-0.5 block text-[0.58rem] uppercase tracking-[0.08em]">{matchCount} m</span> : null}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs font-semibold text-stone-700/80">{formatDateKey(effectiveDateKey)} · {visibleMatches.length} matches</p>
          {resultsError ? <p className="mt-2 text-xs font-semibold text-red-900">{resultsError}</p> : null}
        </div>

        <div className="mb-5 space-y-3">
          {activeUsers.length > 0 ? (
            activeUsers.map((user) => {
              const submitted = dailyPredictionCounts.get(user.id) ?? 0
              const complete = visibleMatches.length > 0 && submitted >= visibleMatches.length
              const isSelected = selectedUser?.id === user.id

              return (
                <button
                  key={user.id}
                  type="button"
                  className={[
                    'view-tab w-full',
                    isSelected ? 'view-tab-active' : '',
                    complete ? 'border-[#7b6f2d] bg-[#d7d39d]' : 'border-[#8d4930] bg-[#e7bea5]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <span className="view-tab__copy">
                    <span className="view-tab__meta">
                      <span className="view-tab__step">{complete ? 'Complete' : 'Needs picks'}</span>
                      <span
                        className={[
                          'view-tab__status',
                          complete ? 'view-tab__status-ready' : 'border-[#8d4930] bg-[#d9a087] text-[#3a160d]',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {submitted}/{visibleMatches.length}
                      </span>
                    </span>
                    <span className="view-tab__label">{user.name}</span>
                  </span>
                  <span className="view-tab__badge">{complete ? '✓' : submitted}</span>
                </button>
              )
            })
          ) : (
            <div className="empty-state">All players are disabled for this round.</div>
          )}
        </div>

        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Leaderboard</p>
        </div>
        <div className="space-y-3">
          {leaderboard.map((row, index) => (
            <div key={row.userId} className="leader-row flex-col items-stretch gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-stone-900">
                    #{index + 1} {row.userName}
                  </p>
                  <p className="text-sm text-stone-700/80">
                    {row.exactScores} exact · {row.correctOutcomes} outcome · {row.predictionsSubmitted} picks
                  </p>
                </div>
                <span className="count-pill">{row.totalPoints} pt</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="glass-panel p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-800/75">Prediction</p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-stone-900">
              {selectedUser ? `${selectedUser.name}'s picks` : 'Choose a player'}
            </h3>
          <p className="mt-1 text-sm font-semibold text-stone-700/80">{formatDateKey(effectiveDateKey)} · only matches on this calendar date.</p>
          <p className="mt-1 text-sm font-semibold text-stone-700/80">Locked after kickoff. Results are local and visible to everyone on this device.</p>
          </div>
          {selectedUser ? (
            <button type="button" className="dramatic-button dramatic-button-muted dramatic-button-small" onClick={() => setSelectedUserId(null)}>
              Back to players
            </button>
          ) : null}
        </div>

        <div className="space-y-6">
          {!selectedUser ? (
            <div className="empty-state">Select a player on the left to enter picks for this date.</div>
          ) : null}
          {visibleMatches.length === 0 ? (
            <div className="empty-state">No World Cup matches on this date. Choose a match date.</div>
          ) : null}
          {selectedUser ? Object.entries(groupedMatches).map(([groupName, matches]) => (
            <section key={groupName} className="space-y-3">
              <h4 className="rounded-full border border-[#785328] bg-[#f0ddb4] px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-[#4a2f17]">
                {groupName}
              </h4>
              {matches.map((match) => {
                const prediction = predictionsByMatch.get(match.id)
                const result = resultsByMatch.get(match.id)
                const matchStatus = getMatchStatus(match.kickoff, liveTime, fifaApiMatchesByNumber.get(match.matchNumber))
                const locked = new Date(match.kickoff).getTime() <= nowTime
                const earned = prediction && result ? scorePrediction(prediction, result) : null
                const hasResult = Boolean(result && matchStatus.started)
                const points = earned?.points ?? (hasResult ? 0 : null)
                const scoreTone = hasResult ? (points && points > 0 ? 'correct' : 'wrong') : 'pending'
                const resultChipClass = [
                  'count-pill',
                  scoreTone === 'correct'
                    ? 'border-[#637a35] bg-[#d7d39d] text-[#2f2a11]'
                    : scoreTone === 'wrong'
                      ? 'border-[#8d4930] bg-[#e7bea5] text-[#3a160d]'
                      : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                const scoreCardClass = [
                  'mt-4 rounded-[1rem] border p-3 transition',
                  scoreTone === 'correct'
                    ? 'border-[#637a35] bg-[#d7d39d]'
                    : scoreTone === 'wrong'
                      ? 'border-[#8d4930] bg-[#e7bea5]'
                      : 'border-[#8f6c3b] bg-[#ead3a7]',
                ].join(' ')

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
                        <span className="count-pill">
                        {matchStatus.minute ? `${matchStatus.label} ${matchStatus.minute}'` : matchStatus.label}
                        </span>
                        {locked ? <span className="count-pill">Locked</span> : <span className="count-pill">Open</span>}
                        {points !== null ? <span className="count-pill">{points} pt</span> : null}
                      </div>
                    </div>

                    <div className={scoreCardClass}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-700/75">Score card</p>
                        {matchStatus.started ? (
                          <span className={resultChipClass}>
                            {result ? `Result ${result.homeScore}-${result.awayScore}` : 'Result pending'}
                            {points !== null ? ` · ${points} pt` : ''}
                          </span>
                        ) : null}
                      </div>

                      <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
                        <div className="grid gap-2">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-700/75">{match.homeTeam}</p>
                          <label className="grid gap-1">
                            <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-stone-700/70">Prediction</span>
                            <input
                              className="dramatic-input min-w-0"
                              type="number"
                              min="0"
                              step="1"
                              aria-label={`Prediction ${match.homeTeam}`}
                              value={scoreValue(prediction?.homeScore)}
                              disabled={matchStatus.started || locked || !selectedUser}
                              onChange={(event) => savePredictionPart(match, 'home', event.target.value)}
                            />
                          </label>
                        </div>
                        <span className="pt-8 text-center text-xs font-black uppercase tracking-[0.2em] text-stone-700/70">vs</span>
                        <div className="grid gap-2">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-700/75">{match.awayTeam}</p>
                          <label className="grid gap-1">
                            <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-stone-700/70">Prediction</span>
                            <input
                              className="dramatic-input min-w-0"
                              type="number"
                              min="0"
                              step="1"
                              aria-label={`Prediction ${match.awayTeam}`}
                              value={scoreValue(prediction?.awayScore)}
                              disabled={matchStatus.started || locked || !selectedUser}
                              onChange={(event) => savePredictionPart(match, 'away', event.target.value)}
                            />
                          </label>
                        </div>
                      </div>

                      <p className="mt-2 text-xs font-semibold text-stone-700/80">
                        {locked ? 'Prediction locked after kickoff' : 'Prediction saves locally right away'}
                      </p>
                    </div>
                  </article>
                )
              })}
            </section>
          )) : null}
        </div>
      </div>
    </motion.section>
  )
}

export default FootballPoolPanel
