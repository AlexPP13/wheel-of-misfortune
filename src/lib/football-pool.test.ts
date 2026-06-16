import { describe, expect, it } from 'vitest'

import type { FootballPrediction, FootballResult, User, WorldCupMatch } from '../types/app'
import { buildFootballLeaderboard, getFootballPoolDayWindow, isMatchInFootballPoolDay, scorePrediction } from './football-pool'

const users: User[] = [
  { id: 'u1', name: 'Ada', disabled: false },
  { id: 'u2', name: 'Grace', disabled: false },
  { id: 'u3', name: 'Linus', disabled: false },
]

const matches: WorldCupMatch[] = [
  {
    id: 'm1',
    matchNumber: 1,
    stage: 'Group stage',
    group: 'A',
    homeTeam: 'Mexico',
    awayTeam: 'South Africa',
    kickoff: '2026-06-11T19:00:00.000Z',
    venue: 'Mexico City, Mexico',
  },
  {
    id: 'm2',
    matchNumber: 2,
    stage: 'Group stage',
    group: 'A',
    homeTeam: 'South Korea',
    awayTeam: 'Czech Republic',
    kickoff: '2026-06-12T18:00:00.000Z',
    venue: 'Zapopan, Mexico',
  },
]

function prediction(userId: string, matchId: string, homeScore: number, awayScore: number): FootballPrediction {
  return { userId, matchId, homeScore, awayScore, updatedAt: '2026-06-01T00:00:00.000Z' }
}

function result(matchId: string, homeScore: number, awayScore: number): FootballResult {
  return { matchId, homeScore, awayScore, updatedAt: '2026-06-12T00:00:00.000Z' }
}

describe('scorePrediction', () => {
  it('returns 3 points for exact score', () => {
    expect(scorePrediction(prediction('u1', 'm1', 2, 1), result('m1', 2, 1))).toEqual({
      points: 3,
      exact: true,
      outcome: true,
    })
  })

  it('returns 1 point for correct outcome but wrong score', () => {
    expect(scorePrediction(prediction('u1', 'm1', 1, 0), result('m1', 2, 1))).toEqual({
      points: 1,
      exact: false,
      outcome: true,
    })
  })

  it('returns 0 points for wrong outcome', () => {
    expect(scorePrediction(prediction('u1', 'm1', 0, 1), result('m1', 2, 1))).toEqual({
      points: 0,
      exact: false,
      outcome: false,
    })
  })
})

describe('buildFootballLeaderboard', () => {
  it('sorts by points, exact scores, outcomes, then name', () => {
    const leaderboard = buildFootballLeaderboard(
      users,
      [
        prediction('u1', 'm1', 2, 0),
        prediction('u1', 'm2', 1, 0),
        prediction('u2', 'm1', 3, 1),
        prediction('u2', 'm2', 2, 1),
        prediction('u3', 'm1', 1, 1),
      ],
      [result('m1', 2, 0), result('m2', 3, 2)],
      matches,
    )

    expect(leaderboard.map((row) => row.userName)).toEqual(['Ada', 'Grace', 'Linus'])
    expect(leaderboard[0]).toMatchObject({ totalPoints: 4, exactScores: 1, correctOutcomes: 2 })
    expect(leaderboard[1]).toMatchObject({ totalPoints: 2, exactScores: 0, correctOutcomes: 2 })
  })

  it('ignores predictions if no result exists', () => {
    const [row] = buildFootballLeaderboard(users.slice(0, 1), [prediction('u1', 'm1', 2, 0)], [], matches)

    expect(row).toMatchObject({ totalPoints: 0, exactScores: 0, correctOutcomes: 0, predictionsSubmitted: 1 })
  })

  it('does not crash on removed users or unknown matches', () => {
    const leaderboard = buildFootballLeaderboard(
      users.slice(0, 1),
      [prediction('missing', 'm1', 2, 0), prediction('u1', 'missing', 2, 0)],
      [result('m1', 2, 0), result('missing', 2, 0)],
      matches,
    )

    expect(leaderboard).toEqual([
      {
        userId: 'u1',
        userName: 'Ada',
        totalPoints: 0,
        exactScores: 0,
        correctOutcomes: 0,
        predictionsSubmitted: 0,
      },
    ])
  })
})

describe('football pool day window', () => {
  it('starts a new slate at 09:00', () => {
    const window = getFootballPoolDayWindow(new Date('2026-06-16T09:00:00.000Z'))

    expect(window.start.toISOString()).toBe('2026-06-16T09:00:00.000Z')
    expect(window.end.toISOString()).toBe('2026-06-17T09:00:00.000Z')
  })

  it('keeps 02:00 matches in the previous morning slate', () => {
    expect(
      isMatchInFootballPoolDay(
        { ...matches[0], kickoff: '2026-06-17T02:00:00.000Z' },
        new Date('2026-06-16T10:00:00.000Z'),
      ),
    ).toBe(true)
  })
})
