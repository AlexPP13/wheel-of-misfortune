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

export function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getMatchDateKey(match: WorldCupMatch): string {
  return getLocalDateKey(new Date(match.kickoff))
}

export function getMatchDateKeys(matches: WorldCupMatch[]): string[] {
  return Array.from(new Set(matches.map(getMatchDateKey))).sort()
}

export function isMatchOnDate(match: WorldCupMatch, dateKey: string): boolean {
  return getMatchDateKey(match) === dateKey
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
