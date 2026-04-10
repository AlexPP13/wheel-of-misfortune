import type { HistoryStats, PersistedState, User } from '../types/app'

export const STORAGE_KEY = 'wheel-of-unfortune-state'

export const createDefaultUsers = () => [
  { id: crypto.randomUUID(), name: 'Alex' },
  { id: crypto.randomUUID(), name: 'Sam' },
  { id: crypto.randomUUID(), name: 'Jordan' },
]

export const createDefaultChores = () => [
  { id: crypto.randomUUID(), name: 'Dishes' },
  { id: crypto.randomUUID(), name: 'Vacuum' },
  { id: crypto.randomUUID(), name: 'Laundry' },
  { id: crypto.randomUUID(), name: 'Trash' },
]

export function createDefaultState(): PersistedState {
  const users = createDefaultUsers()
  const chores = createDefaultChores()

  return {
    users,
    chores,
    assignments: [],
    historyCounts: Object.fromEntries(users.map((user) => [user.id, 0])),
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
  const candidates = users.filter((user) => (counts[user.id] ?? 0) === lowestCount)
  const randomIndex = Math.floor(Math.random() * candidates.length)
  return candidates[randomIndex]
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
