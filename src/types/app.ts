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
}

export type AssignmentRow = Assignment & {
  choreName: string
  userName: string
}
