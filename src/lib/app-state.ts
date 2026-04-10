import type { HistoryStats, PersistedState, User } from '../types/app'

export const STORAGE_KEY = 'wheel-of-unfortune-state'

export function createDefaultState(): PersistedState {
  return {
    users: [],
    chores: [],
    assignments: [],
    historyCounts: {},
  }
}

export function getStoredState(): PersistedState {
  const fallback = createDefaultState()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const users = Array.isArray(parsed.users) ? parsed.users : fallback.users
    const chores = Array.isArray(parsed.chores) ? parsed.chores : fallback.chores
    const assignments = Array.isArray(parsed.assignments) ? parsed.assignments : []
    const incomingCounts = parsed.historyCounts ?? {}

    const historyCounts = users.reduce<HistoryStats>((acc, user) => {
      const count = incomingCounts[user.id]
      acc[user.id] = typeof count === 'number' ? count : 0
      return acc
    }, {})

    return { users, chores, assignments, historyCounts }
  } catch {
    return fallback
  }
}

export function chooseFairestUser(users: User[], counts: HistoryStats) {
  const lowestCount = Math.min(...users.map((user) => counts[user.id] ?? 0))
  const highestCount = Math.max(...users.map((user) => counts[user.id] ?? 0))
  const spread = highestCount - lowestCount

  const weightedUsers = users.map((user) => {
    const count = counts[user.id] ?? 0
    const distanceFromLowest = count - lowestCount

    return {
      user,
      weight: Math.max(1, spread + 1 - distanceFromLowest),
    }
  })

  const totalWeight = weightedUsers.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = Math.random() * totalWeight

  for (const entry of weightedUsers) {
    roll -= entry.weight

    if (roll <= 0) {
      return entry.user
    }
  }

  return weightedUsers[weightedUsers.length - 1].user
}

export function getUserAura(index: number) {
  const auras = [
    'contestant-card-theme-amber',
    'contestant-card-theme-ivory',
    'contestant-card-theme-olive',
    'contestant-card-theme-copper',
    'contestant-card-theme-slate',
  ]

  return auras[index % auras.length]
}
