export type User = {
  id: string
  name: string
  disabled: boolean
}

export type Chore = {
  id: string
  name: string
  disabled: boolean
}

export type Assignment = {
  choreId: string
  userId: string
}

export type HistoryStats = Record<string, number>

export type ChoreHistoryStats = Record<string, Record<string, number>>

export type WorldCupMatch = {
  id: string
  matchNumber: number
  stage: 'Group stage' | 'Round of 32' | 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Third-place match' | 'Final'
  group?: string
  homeTeam: string
  awayTeam: string
  kickoff: string
  venue: string
}

export type FootballPrediction = {
  userId: string
  matchId: string
  homeScore: number
  awayScore: number
  updatedAt: string
}

export type FootballResult = {
  matchId: string
  homeScore: number
  awayScore: number
  updatedAt: string
}

export type FairnessDistributionEntry = {
  user: User
  overallCount: number
  choreCount: number
  weight: number
  chance: number
}

export type PersistedState = {
  users: User[]
  chores: Chore[]
  assignments: Assignment[]
  historyCounts: HistoryStats
  choreHistoryCounts: ChoreHistoryStats
  footballPredictions: FootballPrediction[]
  footballResults: FootballResult[]
}

export type AssignmentRow = Assignment & {
  choreName: string
  userName: string
}
