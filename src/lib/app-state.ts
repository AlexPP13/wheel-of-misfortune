import type { ChoreHistoryStats, FairnessDistributionEntry, HistoryStats, PersistedState, User } from '../types/app'

export const STORAGE_KEY = 'wheel-of-unfortune-state'

export function createDefaultState(): PersistedState {
  return {
    users: [],
    chores: [],
    assignments: [],
    historyCounts: {},
    choreHistoryCounts: {},
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
    const users = Array.isArray(parsed.users)
      ? parsed.users
          .filter((user): user is User => Boolean(user?.id) && Boolean(user?.name))
          .map((user) => ({
            id: user.id,
            name: user.name,
            disabled: Boolean(user.disabled),
          }))
      : fallback.users
    const chores = Array.isArray(parsed.chores)
      ? parsed.chores
          .filter((chore): chore is PersistedState['chores'][number] => Boolean(chore?.id) && Boolean(chore?.name))
          .map((chore) => ({
            id: chore.id,
            name: chore.name,
            disabled: Boolean(chore.disabled),
          }))
      : fallback.chores
    const assignments = Array.isArray(parsed.assignments) ? parsed.assignments : []
    const incomingCounts = parsed.historyCounts ?? {}
    const incomingChoreHistoryCounts = parsed.choreHistoryCounts ?? {}

    const historyCounts = users.reduce<HistoryStats>((acc, user) => {
      const count = incomingCounts[user.id]
      acc[user.id] = typeof count === 'number' ? count : 0
      return acc
    }, {})

    const choreHistoryCounts = chores.reduce<ChoreHistoryStats>((acc, chore) => {
      const choreCounts = incomingChoreHistoryCounts[chore.id]

      acc[chore.id] = users.reduce<HistoryStats>((userAcc, user) => {
        const count = choreCounts?.[user.id]
        userAcc[user.id] = typeof count === 'number' ? count : 0
        return userAcc
      }, {})

      return acc
    }, {})

    return { users, chores, assignments, historyCounts, choreHistoryCounts }
  } catch {
    return fallback
  }
}

export function chooseFairestUser(
  users: User[],
  counts: HistoryStats,
  choreId: string,
  choreHistoryCounts: ChoreHistoryStats,
) {
  if (users.length === 0) {
    throw new Error('Cannot choose from an empty user list')
  }

  const weightedUsers = getFairnessDistribution(users, counts, choreId, choreHistoryCounts)
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

export function getFairnessDistribution(
  users: User[],
  counts: HistoryStats,
  choreId: string,
  choreHistoryCounts: ChoreHistoryStats,
): FairnessDistributionEntry[] {
  if (users.length === 0) {
    return []
  }

  const lowestOverallCount = Math.min(...users.map((user) => counts[user.id] ?? 0))
  const highestOverallCount = Math.max(...users.map((user) => counts[user.id] ?? 0))
  const overallSpread = highestOverallCount - lowestOverallCount
  const choreCounts = choreHistoryCounts[choreId] ?? {}
  const lowestChoreCount = Math.min(...users.map((user) => choreCounts[user.id] ?? 0))
  const highestChoreCount = Math.max(...users.map((user) => choreCounts[user.id] ?? 0))
  const choreSpread = highestChoreCount - lowestChoreCount

  const weightedUsers = users.map((user) => {
    const overallCount = counts[user.id] ?? 0
    const choreCount = choreCounts[user.id] ?? 0
    const overallDistanceFromLowest = overallCount - lowestOverallCount
    const choreDistanceFromLowest = choreCount - lowestChoreCount
    const overallWeight = Math.max(1, overallSpread + 1 - overallDistanceFromLowest)
    const choreWeight = Math.max(1, choreSpread + 1 - choreDistanceFromLowest)

    return {
      user,
      overallCount,
      choreCount,
      weight: overallWeight * choreWeight,
    }
  })
  const totalWeight = weightedUsers.reduce((sum, entry) => sum + entry.weight, 0)

  return weightedUsers.map((entry) => ({
    ...entry,
    chance: totalWeight > 0 ? entry.weight / totalWeight : 0,
  }))
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
