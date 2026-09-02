import type {
  Assignment,
  Chore,
  ChoreHistoryStats,
  FairnessDistributionEntry,
  HistoryStats,
  PersistedState,
  ResultSoundPreference,
  User,
} from '../types/app'

export const STORAGE_KEY = 'wheel-of-unfortune-state'

export const DEFAULT_RESULT_SOUND_PREFERENCE: ResultSoundPreference = 'fruit-machine'

const MAX_ASSIGNMENT_CANDIDATES = 5000

export function createDefaultState(): PersistedState {
  return {
    users: [],
    chores: [],
    assignments: [],
    historyCounts: {},
    choreHistoryCounts: {},
    resultSoundPreference: DEFAULT_RESULT_SOUND_PREFERENCE,
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
    const assignments = sanitizeAssignments(parsed.assignments, users, chores)
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

    const resultSoundPreference = isResultSoundPreference(parsed.resultSoundPreference)
      ? parsed.resultSoundPreference
      : fallback.resultSoundPreference

    return { users, chores, assignments, historyCounts, choreHistoryCounts, resultSoundPreference }
  } catch {
    return fallback
  }
}

function isResultSoundPreference(value: unknown): value is ResultSoundPreference {
  return value === 'random' || ['fruit-machine', 'jackpot-fanfare', 'arcade-cheer'].includes(value as string)
}

export function sanitizeAssignments(assignments: unknown, users: User[], chores: Chore[]): Assignment[] {
  if (!Array.isArray(assignments)) {
    return []
  }

  const userIds = new Set(users.map((user) => user.id))
  const choreIds = new Set(chores.map((chore) => chore.id))
  const seenChoreIds = new Set<string>()

  return assignments.filter((assignment): assignment is Assignment => {
    if (!assignment || typeof assignment !== 'object') {
      return false
    }

    const candidate = assignment as Partial<Assignment>

    if (
      typeof candidate.userId !== 'string' ||
      typeof candidate.choreId !== 'string' ||
      !userIds.has(candidate.userId) ||
      !choreIds.has(candidate.choreId) ||
      seenChoreIds.has(candidate.choreId)
    ) {
      return false
    }

    seenChoreIds.add(candidate.choreId)
    return true
  })
}

export type RandomBattleResult = {
  loserUserId: string
  participantUserIds: string[]
  transferredChoreIds: string[]
  winnerUserIds: string[]
  wageredAssignments: Assignment[]
  assignments: Assignment[]
  historyCounts: HistoryStats
  choreHistoryCounts: ChoreHistoryStats
}

export function transferAssignmentOwner({
  choreId,
  fromUserId,
  toUserId,
  assignments,
  historyCounts,
  choreHistoryCounts,
}: {
  choreId: string
  fromUserId: string
  toUserId: string
  assignments: Assignment[]
  historyCounts: HistoryStats
  choreHistoryCounts: ChoreHistoryStats
}): {
  assignments: Assignment[]
  historyCounts: HistoryStats
  choreHistoryCounts: ChoreHistoryStats
} | null {
  if (fromUserId === toUserId) {
    return null
  }

  const currentAssignment = assignments.find((assignment) => assignment.choreId === choreId)

  if (!currentAssignment || currentAssignment.userId !== fromUserId) {
    return null
  }

  return {
    assignments: assignments.map((assignment) =>
      assignment.choreId === choreId ? { ...assignment, userId: toUserId } : assignment,
    ),
    historyCounts: {
      ...historyCounts,
      [fromUserId]: Math.max((historyCounts[fromUserId] ?? 0) - 1, 0),
      [toUserId]: (historyCounts[toUserId] ?? 0) + 1,
    },
    choreHistoryCounts: {
      ...choreHistoryCounts,
      [choreId]: {
        ...choreHistoryCounts[choreId],
        [fromUserId]: Math.max((choreHistoryCounts[choreId]?.[fromUserId] ?? 0) - 1, 0),
        [toUserId]: (choreHistoryCounts[choreId]?.[toUserId] ?? 0) + 1,
      },
    },
  }
}

function pickWeightedBattleLoser(userIds: string[], assignments: Assignment[], rng: () => number) {
  const weightedUsers = userIds.map((userId) => ({
    userId,
    weight: assignments.filter((assignment) => assignment.userId === userId).length,
  }))
  const totalWeight = weightedUsers.reduce((total, user) => total + user.weight, 0)
  let roll = rng() * totalWeight

  for (const user of weightedUsers) {
    roll -= user.weight

    if (roll <= 0) {
      return user.userId
    }
  }

  return weightedUsers[weightedUsers.length - 1].userId
}

export function resolveRandomBattle({
  assignments,
  eligibleUserIds,
  historyCounts,
  choreHistoryCounts,
  rng = Math.random,
}: {
  assignments: Assignment[]
  eligibleUserIds: string[]
  historyCounts: HistoryStats
  choreHistoryCounts: ChoreHistoryStats
  rng?: () => number
}): RandomBattleResult | null {
  const eligibleWithAssignments = eligibleUserIds.filter((userId) =>
    assignments.some((assignment) => assignment.userId === userId),
  )

  if (eligibleWithAssignments.length < 2) {
    return null
  }

  const wageredAssignments = assignments.filter((assignment) => eligibleWithAssignments.includes(assignment.userId))
  const loserUserId = pickWeightedBattleLoser(eligibleWithAssignments, wageredAssignments, rng)
  const transferredChoreIds: string[] = []
  let nextAssignments = assignments
  let nextHistoryCounts = historyCounts
  let nextChoreHistoryCounts = choreHistoryCounts

  for (const assignment of wageredAssignments) {
    if (assignment.userId === loserUserId) {
      continue
    }

    const transferred = transferAssignmentOwner({
      choreId: assignment.choreId,
      fromUserId: assignment.userId,
      toUserId: loserUserId,
      assignments: nextAssignments,
      historyCounts: nextHistoryCounts,
      choreHistoryCounts: nextChoreHistoryCounts,
    })

    if (!transferred) {
      return null
    }

    transferredChoreIds.push(assignment.choreId)
    nextAssignments = transferred.assignments
    nextHistoryCounts = transferred.historyCounts
    nextChoreHistoryCounts = transferred.choreHistoryCounts
  }

  return {
    loserUserId,
    participantUserIds: eligibleWithAssignments,
    transferredChoreIds,
    winnerUserIds: eligibleWithAssignments.filter((userId) => userId !== loserUserId),
    wageredAssignments,
    assignments: nextAssignments,
    historyCounts: nextHistoryCounts,
    choreHistoryCounts: nextChoreHistoryCounts,
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

export function chooseFairestAssignments(
  chores: Chore[],
  users: User[],
  counts: HistoryStats,
  choreHistoryCounts: ChoreHistoryStats,
  existingRoundAssignments: Assignment[] = [],
  roundChores: Chore[] = chores,
): Assignment[] {
  if (chores.length === 0) {
    return []
  }

  if (users.length === 0) {
    throw new Error('Cannot choose from an empty user list')
  }

  const candidates = buildAssignmentCandidates(
    chores,
    users,
    counts,
    choreHistoryCounts,
    existingRoundAssignments,
    roundChores,
    true,
  )
  const viableCandidates = candidates.length > 0
    ? candidates
    : buildAssignmentCandidates(chores, users, counts, choreHistoryCounts, existingRoundAssignments, roundChores, false)

  const scoredCandidates = viableCandidates
    .map((assignments) => ({ assignments, score: scoreAssignments(assignments, users, counts, choreHistoryCounts) }))
    .sort((left, right) => left.score - right.score)
  const bestScore = scoredCandidates[0]?.score ?? 0
  const bestCandidates = scoredCandidates.filter((candidate) => candidate.score === bestScore)
  const chosenIndex = Math.floor(Math.random() * bestCandidates.length)

  return bestCandidates[chosenIndex]?.assignments ?? []
}

function buildAssignmentCandidates(
  chores: Chore[],
  users: User[],
  counts: HistoryStats,
  choreHistoryCounts: ChoreHistoryStats,
  existingRoundAssignments: Assignment[],
  roundChores: Chore[],
  enforceEvenDistribution: boolean,
) {
  const candidates: Assignment[][] = []
  const current: Assignment[] = []
  const assignmentCounts = new Map(users.map((user) => [user.id, 0]))
  const roundChoreIds = new Set(roundChores.map((chore) => chore.id))
  let relevantExistingAssignmentCount = 0

  for (const assignment of existingRoundAssignments) {
    if (!roundChoreIds.has(assignment.choreId) || !assignmentCounts.has(assignment.userId)) {
      continue
    }

    relevantExistingAssignmentCount += 1
    assignmentCounts.set(assignment.userId, (assignmentCounts.get(assignment.userId) ?? 0) + 1)
  }

  const totalRoundAssignments = relevantExistingAssignmentCount + chores.length
  const targetPerUser = Math.floor(totalRoundAssignments / users.length)
  const usersWithExtraAssignment = totalRoundAssignments % users.length
  const maxAssignmentsPerUser = targetPerUser + (usersWithExtraAssignment > 0 ? 1 : 0)

  function visit(choreIndex: number) {
    if (choreIndex === chores.length) {
      const isEvenRoundDistribution = users.every((user) => {
        const userAssignmentCount = assignmentCounts.get(user.id) ?? 0

        return userAssignmentCount >= targetPerUser && userAssignmentCount <= maxAssignmentsPerUser
      })

      if (!enforceEvenDistribution || isEvenRoundDistribution) {
        candidates.push([...current])
      }

      return
    }

    const sortedUsers = [...users].sort((left, right) => {
      const leftChoreCount = choreHistoryCounts[chores[choreIndex].id]?.[left.id] ?? 0
      const rightChoreCount = choreHistoryCounts[chores[choreIndex].id]?.[right.id] ?? 0
      const leftAssignmentCount = assignmentCounts.get(left.id) ?? 0
      const rightAssignmentCount = assignmentCounts.get(right.id) ?? 0
      const leftProjectedCount = (counts[left.id] ?? 0) + leftAssignmentCount
      const rightProjectedCount = (counts[right.id] ?? 0) + rightAssignmentCount

      return leftChoreCount - rightChoreCount || leftProjectedCount - rightProjectedCount || Math.random() - 0.5
    })

    for (const user of sortedUsers) {
      if (candidates.length >= MAX_ASSIGNMENT_CANDIDATES) {
        return
      }

      const userAssignmentCount = assignmentCounts.get(user.id) ?? 0

      if (userAssignmentCount >= maxAssignmentsPerUser) {
        continue
      }

      current.push({ choreId: chores[choreIndex].id, userId: user.id })
      assignmentCounts.set(user.id, userAssignmentCount + 1)
      visit(choreIndex + 1)
      assignmentCounts.set(user.id, userAssignmentCount)
      current.pop()
    }
  }

  visit(0)

  return candidates
}

function scoreAssignments(
  assignments: Assignment[],
  users: User[],
  counts: HistoryStats,
  choreHistoryCounts: ChoreHistoryStats,
) {
  const projectedCounts = { ...counts }
  let choreSpecificPenalty = 0

  for (const assignment of assignments) {
    projectedCounts[assignment.userId] = (projectedCounts[assignment.userId] ?? 0) + 1
    choreSpecificPenalty += choreHistoryCounts[assignment.choreId]?.[assignment.userId] ?? 0
  }

  const userCounts = users.map((user) => projectedCounts[user.id] ?? 0)
  const lowestOverallCount = Math.min(...userCounts)
  const highestOverallCount = Math.max(...userCounts)
  const overallSpreadPenalty = (highestOverallCount - lowestOverallCount) * users.length
  const distanceFromEvenPenalty = userCounts.reduce((sum, count) => {
    return sum + Math.abs(count - lowestOverallCount)
  }, 0)

  return overallSpreadPenalty + distanceFromEvenPenalty + choreSpecificPenalty * 2
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
