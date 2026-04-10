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
    'from-fuchsia-500/40 via-orange-400/25 to-yellow-300/20',
    'from-cyan-400/35 via-blue-500/20 to-violet-500/25',
    'from-emerald-400/35 via-lime-300/20 to-yellow-300/25',
    'from-rose-500/35 via-pink-400/25 to-fuchsia-400/20',
    'from-purple-500/35 via-indigo-400/20 to-sky-300/25',
  ]

  return auras[index % auras.length]
}
