export type User = {
  id: string
  name: string
}

export type Chore = {
  id: string
  name: string
}

export type Assignment = {
  choreId: string
  userId: string
}

export type HistoryStats = Record<string, number>

export type PersistedState = {
  users: User[]
  chores: Chore[]
  assignments: Assignment[]
  historyCounts: HistoryStats
}

export type AssignmentRow = Assignment & {
  choreName: string
  userName: string
}
