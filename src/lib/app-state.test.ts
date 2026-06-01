import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Assignment, Chore, ChoreHistoryStats, HistoryStats, User } from '../types/app'
import {
  STORAGE_KEY,
  chooseFairestAssignments,
  createDefaultState,
  getStoredState,
  resolveRandomBattle,
  transferAssignmentOwner,
} from './app-state'

const users: User[] = [
  { id: 'user-1', name: 'Ada', disabled: false },
  { id: 'user-2', name: 'Grace', disabled: false },
]

const chores: Chore[] = [
  { id: 'chore-1', name: 'Dishes', disabled: false },
  { id: 'chore-2', name: 'Trash', disabled: false },
]

function storeState(state: unknown) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function assignmentCounts(assignments: Assignment[]) {
  return assignments.reduce<Record<string, number>>((counts, assignment) => {
    counts[assignment.userId] = (counts[assignment.userId] ?? 0) + 1
    return counts
  }, {})
}

describe('getStoredState', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns createDefaultState() when localStorage is empty', () => {
    expect(getStoredState()).toEqual(createDefaultState())
  })

  it('returns createDefaultState() when stored JSON is invalid', () => {
    localStorage.setItem(STORAGE_KEY, '{nope')

    expect(getStoredState()).toEqual(createDefaultState())
  })

  it('sanitizes users and chores', () => {
    storeState({
      users: [users[0], null, { id: '', name: 'Missing id' }, { id: 'missing-name' }],
      chores: [chores[0], null, { id: '', name: 'Missing id' }, { id: 'missing-name' }],
    })

    expect(getStoredState()).toMatchObject({
      users: [users[0]],
      chores: [chores[0]],
    })
  })

  it('keeps only assignments with valid userId and choreId', () => {
    storeState({
      users,
      chores,
      assignments: [
        { userId: 'user-1', choreId: 'chore-1' },
        { userId: 1, choreId: 'chore-2' },
        { userId: 'user-2', choreId: null },
        null,
      ],
    })

    expect(getStoredState().assignments).toEqual([{ userId: 'user-1', choreId: 'chore-1' }])
  })

  it('removes assignments referencing missing users', () => {
    storeState({
      users,
      chores,
      assignments: [
        { userId: 'missing-user', choreId: 'chore-1' },
        { userId: 'user-2', choreId: 'chore-2' },
      ],
    })

    expect(getStoredState().assignments).toEqual([{ userId: 'user-2', choreId: 'chore-2' }])
  })

  it('removes assignments referencing missing chores', () => {
    storeState({
      users,
      chores,
      assignments: [
        { userId: 'user-1', choreId: 'missing-chore' },
        { userId: 'user-2', choreId: 'chore-2' },
      ],
    })

    expect(getStoredState().assignments).toEqual([{ userId: 'user-2', choreId: 'chore-2' }])
  })

  it('deduplicates assignments by choreId', () => {
    storeState({
      users,
      chores,
      assignments: [
        { userId: 'user-1', choreId: 'chore-1' },
        { userId: 'user-2', choreId: 'chore-1' },
        { userId: 'user-2', choreId: 'chore-2' },
      ],
    })

    expect(getStoredState().assignments).toEqual([
      { userId: 'user-1', choreId: 'chore-1' },
      { userId: 'user-2', choreId: 'chore-2' },
    ])
  })

  it('rebuilds historyCounts only for sanitized users', () => {
    storeState({
      users,
      chores,
      historyCounts: { 'user-1': 3, 'user-2': 'bad', 'missing-user': 8 },
    })

    expect(getStoredState().historyCounts).toEqual({ 'user-1': 3, 'user-2': 0 })
  })

  it('rebuilds choreHistoryCounts only for sanitized chores and users', () => {
    storeState({
      users,
      chores,
      choreHistoryCounts: {
        'chore-1': { 'user-1': 2, 'user-2': 'bad', 'missing-user': 4 },
        'missing-chore': { 'user-1': 9 },
      },
    })

    expect(getStoredState().choreHistoryCounts).toEqual({
      'chore-1': { 'user-1': 2, 'user-2': 0 },
      'chore-2': { 'user-1': 0, 'user-2': 0 },
    })
  })
})

describe('chooseFairestAssignments', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns [] when chores is empty', () => {
    expect(chooseFairestAssignments([], users, {}, {})).toEqual([])
  })

  it('throws when users is empty', () => {
    expect(() => chooseFairestAssignments(chores, [], {}, {})).toThrow('Cannot choose from an empty user list')
  })

  it('assigns every provided chore exactly once', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const assignments = chooseFairestAssignments(chores, users, {}, {})

    expect(assignments).toHaveLength(chores.length)
    expect(new Set(assignments.map((assignment) => assignment.choreId))).toEqual(new Set(chores.map((chore) => chore.id)))
  })

  it('keeps round distribution even where possible', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const assignments = chooseFairestAssignments(
      [
        ...chores,
        { id: 'chore-3', name: 'Laundry', disabled: false },
        { id: 'chore-4', name: 'Vacuum', disabled: false },
      ],
      users,
      {},
      {},
    )

    expect(assignmentCounts(assignments)).toEqual({ 'user-1': 2, 'user-2': 2 })
  })

  it('respects existing round assignments', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const assignments = chooseFairestAssignments(
      [chores[1]],
      users,
      {},
      {},
      [{ userId: 'user-1', choreId: 'chore-1' }],
      chores,
    )

    expect(assignments).toEqual([{ userId: 'user-2', choreId: 'chore-2' }])
  })

  it('prefers lower overall burden when the scenario is deterministic', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const counts: HistoryStats = { 'user-1': 5, 'user-2': 0 }

    expect(chooseFairestAssignments([chores[0]], users, counts, {})).toEqual([
      { userId: 'user-2', choreId: 'chore-1' },
    ])
  })

  it('penalizes repeated chore-specific burden when the scenario is deterministic', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const choreHistoryCounts: ChoreHistoryStats = {
      'chore-1': { 'user-1': 3, 'user-2': 0 },
    }

    expect(chooseFairestAssignments([chores[0]], users, {}, choreHistoryCounts)).toEqual([
      { userId: 'user-2', choreId: 'chore-1' },
    ])
  })
})

describe('transferAssignmentOwner', () => {
  const assignments: Assignment[] = [{ choreId: 'chore-1', userId: 'user-1' }]
  const historyCounts: HistoryStats = { 'user-1': 1, 'user-2': 0 }
  const choreHistoryCounts: ChoreHistoryStats = { 'chore-1': { 'user-1': 1, 'user-2': 0 } }

  it('transfers the chore and updates all history counts', () => {
    const result = transferAssignmentOwner({
      choreId: 'chore-1',
      fromUserId: 'user-1',
      toUserId: 'user-2',
      assignments,
      historyCounts,
      choreHistoryCounts,
    })

    expect(result).toEqual({
      assignments: [{ choreId: 'chore-1', userId: 'user-2' }],
      historyCounts: { 'user-1': 0, 'user-2': 1 },
      choreHistoryCounts: { 'chore-1': { 'user-1': 0, 'user-2': 1 } },
    })
  })

  it('clamps decremented counts at 0', () => {
    const result = transferAssignmentOwner({
      choreId: 'chore-1',
      fromUserId: 'user-1',
      toUserId: 'user-2',
      assignments,
      historyCounts: { 'user-1': 0, 'user-2': 0 },
      choreHistoryCounts: { 'chore-1': { 'user-1': 0, 'user-2': 0 } },
    })

    expect(result?.historyCounts['user-1']).toBe(0)
    expect(result?.choreHistoryCounts['chore-1']['user-1']).toBe(0)
  })

  it('returns null for missing or stale assignments', () => {
    expect(
      transferAssignmentOwner({
        choreId: 'missing-chore',
        fromUserId: 'user-1',
        toUserId: 'user-2',
        assignments,
        historyCounts,
        choreHistoryCounts,
      }),
    ).toBeNull()
    expect(
      transferAssignmentOwner({
        choreId: 'chore-1',
        fromUserId: 'user-2',
        toUserId: 'user-1',
        assignments,
        historyCounts,
        choreHistoryCounts,
      }),
    ).toBeNull()
  })

  it('returns null when users match', () => {
    expect(
      transferAssignmentOwner({
        choreId: 'chore-1',
        fromUserId: 'user-1',
        toUserId: 'user-1',
        assignments,
        historyCounts,
        choreHistoryCounts,
      }),
    ).toBeNull()
  })
})

describe('resolveRandomBattle', () => {
  const battleAssignments: Assignment[] = [
    { choreId: 'chore-1', userId: 'user-1' },
    { choreId: 'chore-2', userId: 'user-2' },
    { choreId: 'chore-3', userId: 'user-1' },
  ]
  const historyCounts: HistoryStats = { 'user-1': 2, 'user-2': 1, 'user-3': 0 }
  const choreHistoryCounts: ChoreHistoryStats = {
    'chore-1': { 'user-1': 1, 'user-2': 0, 'user-3': 0 },
    'chore-2': { 'user-1': 0, 'user-2': 1, 'user-3': 0 },
    'chore-3': { 'user-1': 1, 'user-2': 0, 'user-3': 0 },
  }

  it('returns null when fewer than two eligible assigned users exist', () => {
    expect(
      resolveRandomBattle({
        assignments: battleAssignments,
        eligibleUserIds: ['user-1', 'user-3'],
        historyCounts,
        choreHistoryCounts,
      }),
    ).toBeNull()
  })

  it('selects distinct users and transfers the winner task to the loser', () => {
    const rolls = [0, 0, 0, 0, 0.9]
    const result = resolveRandomBattle({
      assignments: battleAssignments,
      eligibleUserIds: ['user-1', 'user-2'],
      historyCounts,
      choreHistoryCounts,
      rng: () => rolls.shift() ?? 0,
    })

    expect(result?.first.userId).toBe('user-1')
    expect(result?.second.userId).toBe('user-2')
    expect(result?.winnerUserId).toBe('user-1')
    expect(result?.loserUserId).toBe('user-2')
    expect(result?.transferredChoreId).toBe('chore-1')
    expect(result?.assignments).toEqual([
      { choreId: 'chore-1', userId: 'user-2' },
      { choreId: 'chore-2', userId: 'user-2' },
      { choreId: 'chore-3', userId: 'user-1' },
    ])
    expect(result?.historyCounts).toEqual({ 'user-1': 1, 'user-2': 2, 'user-3': 0 })
    expect(result?.choreHistoryCounts['chore-1']).toEqual({ 'user-1': 0, 'user-2': 1, 'user-3': 0 })
    expect(result?.choreHistoryCounts['chore-2']).toEqual({ 'user-1': 0, 'user-2': 1, 'user-3': 0 })
  })
})
