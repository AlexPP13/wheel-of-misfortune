import type { FootballPrediction, FootballResult, User, WorldCupMatch } from '../types/app'

export type FootballOutcome = 'home' | 'draw' | 'away'

export type FootballPredictionScore = {
  points: number
  exact: boolean
  outcome: boolean
}

export type FootballLeaderboardRow = {
  userId: string
  userName: string
  totalPoints: number
  exactScores: number
  correctOutcomes: number
  predictionsSubmitted: number
}

export function getFootballPoolDayWindow(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now)
  start.setHours(9, 0, 0, 0)

  if (now < start) {
    start.setDate(start.getDate() - 1)
  }

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}

export function isMatchInFootballPoolDay(match: WorldCupMatch, now = new Date()): boolean {
  const { start, end } = getFootballPoolDayWindow(now)
  const kickoff = new Date(match.kickoff)

  return kickoff >= start && kickoff < end
}

export function getOutcome(homeScore: number, awayScore: number): FootballOutcome {
  if (homeScore > awayScore) return 'home'
  if (homeScore < awayScore) return 'away'
  return 'draw'
}

export function scorePrediction(
  prediction: Pick<FootballPrediction, 'homeScore' | 'awayScore'>,
  result: Pick<FootballResult, 'homeScore' | 'awayScore'>,
): FootballPredictionScore {
  const exact = prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore
  const outcome = getOutcome(prediction.homeScore, prediction.awayScore) === getOutcome(result.homeScore, result.awayScore)

  return {
    points: exact ? 3 : outcome ? 1 : 0,
    exact,
    outcome,
  }
}

export function buildFootballLeaderboard(
  users: User[],
  predictions: FootballPrediction[],
  results: FootballResult[],
  matches: WorldCupMatch[],
): FootballLeaderboardRow[] {
  const userIds = new Set(users.map((user) => user.id))
  const matchIds = new Set(matches.map((match) => match.id))
  const resultsByMatchId = new Map(results.filter((result) => matchIds.has(result.matchId)).map((result) => [result.matchId, result]))

  return users
    .map((user) => {
      const userPredictions = predictions.filter(
        (prediction) => prediction.userId === user.id && userIds.has(prediction.userId) && matchIds.has(prediction.matchId),
      )

      return userPredictions.reduce<FootballLeaderboardRow>(
        (row, prediction) => {
          row.predictionsSubmitted += 1
          const result = resultsByMatchId.get(prediction.matchId)

          if (!result) {
            return row
          }

          const score = scorePrediction(prediction, result)
          row.totalPoints += score.points
          row.exactScores += score.exact ? 1 : 0
          row.correctOutcomes += score.outcome ? 1 : 0
          return row
        },
        {
          userId: user.id,
          userName: user.name,
          totalPoints: 0,
          exactScores: 0,
          correctOutcomes: 0,
          predictionsSubmitted: 0,
        },
      )
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores
      if (b.correctOutcomes !== a.correctOutcomes) return b.correctOutcomes - a.correctOutcomes
      return a.userName.localeCompare(b.userName)
    })
}
