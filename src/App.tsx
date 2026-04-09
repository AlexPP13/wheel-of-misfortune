import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

type User = {
  id: string
  name: string
}

type Chore = {
  id: string
  name: string
}

type Assignment = {
  choreId: string
  userId: string
}

type HistoryStats = Record<string, number>

type PersistedState = {
  users: User[]
  chores: Chore[]
  assignments: Assignment[]
  historyCounts: HistoryStats
}

const STORAGE_KEY = 'wheel-of-unfortune-state'

const defaultUsers: User[] = [
  { id: crypto.randomUUID(), name: 'Alex' },
  { id: crypto.randomUUID(), name: 'Sam' },
  { id: crypto.randomUUID(), name: 'Jordan' },
]

const defaultChores: Chore[] = [
  { id: crypto.randomUUID(), name: 'Dishes' },
  { id: crypto.randomUUID(), name: 'Vacuum' },
  { id: crypto.randomUUID(), name: 'Laundry' },
  { id: crypto.randomUUID(), name: 'Trash' },
]

const defaultState: PersistedState = {
  users: defaultUsers,
  chores: defaultChores,
  assignments: [],
  historyCounts: Object.fromEntries(defaultUsers.map((user) => [user.id, 0])),
}

function getStoredState(): PersistedState {
  const fallback = structuredClone(defaultState)

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

function chooseFairestUser(users: User[], counts: HistoryStats) {
  const lowestCount = Math.min(...users.map((user) => counts[user.id] ?? 0))
  const candidates = users.filter((user) => (counts[user.id] ?? 0) === lowestCount)
  const randomIndex = Math.floor(Math.random() * candidates.length)
  return candidates[randomIndex]
}

function App() {
  const initialStateRef = useRef<PersistedState | null>(null)

  if (!initialStateRef.current) {
    initialStateRef.current = getStoredState()
  }

  const [users, setUsers] = useState<User[]>(initialStateRef.current.users)
  const [chores, setChores] = useState<Chore[]>(initialStateRef.current.chores)
  const [assignments, setAssignments] = useState<Assignment[]>(initialStateRef.current.assignments)
  const [historyCounts, setHistoryCounts] = useState<HistoryStats>(initialStateRef.current.historyCounts)
  const [userName, setUserName] = useState('')
  const [choreName, setChoreName] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [currentChoreId, setCurrentChoreId] = useState<string | null>(null)
  const [message, setMessage] = useState('Add users and chores, then let chaos assign the work fairly.')

  useEffect(() => {
    const sanitizedCounts = users.reduce<HistoryStats>((acc, user) => {
      acc[user.id] = historyCounts[user.id] ?? 0
      return acc
    }, {})

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ users, chores, assignments, historyCounts: sanitizedCounts }),
    )
  }, [users, chores, assignments, historyCounts])

  const assignmentRows = useMemo(() => {
    return assignments
      .map((assignment) => {
        const chore = chores.find((item) => item.id === assignment.choreId)
        const user = users.find((item) => item.id === assignment.userId)

        if (!chore || !user) {
          return null
        }

        return {
          ...assignment,
          choreName: chore.name,
          userName: user.name,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [assignments, chores, users])

  const remainingChores = useMemo(() => {
    const assigned = new Set(assignments.map((assignment) => assignment.choreId))
    return chores.filter((chore) => !assigned.has(chore.id))
  }, [assignments, chores])

  const canSpin = users.length > 0 && chores.length > 0 && !isSpinning

  const addUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = userName.trim()

    if (!trimmed) return

    const newUser = { id: crypto.randomUUID(), name: trimmed }
    setUsers((current) => [...current, newUser])
    setHistoryCounts((current) => ({ ...current, [newUser.id]: 0 }))
    setUserName('')
  }

  const addChore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = choreName.trim()

    if (!trimmed) return

    setChores((current) => [...current, { id: crypto.randomUUID(), name: trimmed }])
    setChoreName('')
  }

  const removeUser = (userId: string) => {
    setUsers((current) => current.filter((user) => user.id !== userId))
    setAssignments((current) => current.filter((assignment) => assignment.userId !== userId))
    setHistoryCounts((current) => {
      const next = { ...current }
      delete next[userId]
      return next
    })

    if (activeUserId === userId) {
      setActiveUserId(null)
    }
  }

  const removeChore = (choreId: string) => {
    setChores((current) => current.filter((chore) => chore.id !== choreId))
    setAssignments((current) => current.filter((assignment) => assignment.choreId !== choreId))

    if (currentChoreId === choreId) {
      setCurrentChoreId(null)
    }
  }

  const runSpin = async () => {
    if (users.length === 0) {
      setMessage('You need at least one user before fate can strike.')
      return
    }

    if (remainingChores.length === 0) {
      setMessage('Every chore is already delegated. Reset the round to spin again.')
      return
    }

    setIsSpinning(true)
    setMessage('The wheel is wobbling toward justice...')

    let nextCounts = { ...historyCounts }
    const producedAssignments: Assignment[] = []

    for (const chore of remainingChores) {
      setCurrentChoreId(chore.id)

      for (let tick = 0; tick < 10; tick += 1) {
        const highlighted = users[tick % users.length]
        setActiveUserId(highlighted.id)
        await new Promise((resolve) => window.setTimeout(resolve, 90 + tick * 18))
      }

      const chosenUser = chooseFairestUser(users, nextCounts)
      setActiveUserId(chosenUser.id)

      const nextAssignment = { choreId: chore.id, userId: chosenUser.id }
      producedAssignments.push(nextAssignment)
      nextCounts = {
        ...nextCounts,
        [chosenUser.id]: (nextCounts[chosenUser.id] ?? 0) + 1,
      }

      setAssignments((current) => [...current, nextAssignment])
      setHistoryCounts(nextCounts)
      setMessage(`${chosenUser.name} has been chosen for ${chore.name}.`)

      await new Promise((resolve) => window.setTimeout(resolve, 550))
    }

    setCurrentChoreId(null)
    setIsSpinning(false)
    setMessage(
      producedAssignments.length > 0
        ? 'Every chore has been delegated exactly once. The wheel is pleased.'
        : 'Nothing left to assign this round.',
    )
  }

  const resetRound = () => {
    setAssignments([])
    setCurrentChoreId(null)
    setActiveUserId(null)
    setIsSpinning(false)
    setMessage('Round cleared. Historical fairness is still remembered.')
  }

  const resetEverything = () => {
    localStorage.removeItem(STORAGE_KEY)
    const freshUsers: User[] = [
      { id: crypto.randomUUID(), name: 'Alex' },
      { id: crypto.randomUUID(), name: 'Sam' },
      { id: crypto.randomUUID(), name: 'Jordan' },
    ]
    const freshChores: Chore[] = [
      { id: crypto.randomUUID(), name: 'Dishes' },
      { id: crypto.randomUUID(), name: 'Vacuum' },
      { id: crypto.randomUUID(), name: 'Laundry' },
      { id: crypto.randomUUID(), name: 'Trash' },
    ]

    setUsers(freshUsers)
    setChores(freshChores)
    setAssignments([])
    setHistoryCounts(Object.fromEntries(freshUsers.map((user) => [user.id, 0])))
    setCurrentChoreId(null)
    setActiveUserId(null)
    setIsSpinning(false)
    setMessage('Everything has been reset. Fresh chaos awaits.')
  }

  const currentChoreName = currentChoreId
    ? chores.find((chore) => chore.id === currentChoreId)?.name ?? 'Finding victim…'
    : remainingChores[0]?.name ?? 'All chores assigned'

  return (
    <main className="flex flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <section className="glass-panel flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between lg:p-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
            Wheel of (Un)Fortune
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            Spin the wheel, spread the suffering fairly.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-300 sm:text-lg">
            Add your people, list the chores, and let the app assign every task exactly once.
            Across multiple rounds, local history keeps the workload balanced.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="pill-button bg-gradient-to-br from-orange-500 to-purple-400 text-white"
            onClick={runSpin}
            disabled={!canSpin}
          >
            {isSpinning ? 'Spinning…' : remainingChores.length === 0 ? 'All tasks assigned' : 'Spin the wheel'}
          </button>
          <button
            className="pill-button bg-slate-400/15 text-slate-50"
            onClick={resetRound}
            disabled={isSpinning}
          >
            Reset round
          </button>
          <button
            className="pill-button bg-red-500/15 text-red-200"
            onClick={resetEverything}
            disabled={isSpinning}
          >
            Reset everything
          </button>
        </div>
      </section>

      <section className="glass-panel grid gap-5 p-5 md:grid-cols-3 md:items-center md:px-6">
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
            Current chore
          </span>
          <strong className="block text-slate-50">{currentChoreName}</strong>
        </div>
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">
            Round progress
          </span>
          <strong className="block text-slate-50">
            {assignments.length} / {chores.length} chores delegated
          </strong>
        </div>
        <p className="self-end text-slate-200">{message}</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">Crew</p>
              <h2 className="text-2xl font-semibold text-slate-50">Users</h2>
            </div>
            <span className="rounded-full bg-purple-400/15 px-3 py-1.5 text-sm font-medium text-purple-200">
              {users.length}
            </span>
          </div>

          <form className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={addUser}>
            <input
              className="rounded-2xl border border-slate-400/20 bg-slate-900/40 px-4 py-3 text-slate-50 outline-none transition focus:border-purple-400/60"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Add a user"
              aria-label="User name"
            />
            <button type="submit" className="pill-button bg-emerald-500/20 text-emerald-200">
              Add
            </button>
          </form>

          <ul className="flex list-none flex-col gap-3 p-0">
            {users.map((user) => (
              <li
                key={user.id}
                className={[
                  'flex flex-col gap-4 rounded-2xl border border-slate-400/15 bg-slate-800/70 p-4 sm:flex-row sm:items-center sm:justify-between',
                  activeUserId === user.id ? 'border-orange-400/70 shadow-[0_0_0_1px_rgba(249,115,22,0.4)]' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div>
                  <strong className="text-slate-50">{user.name}</strong>
                  <span className="mt-1 block text-sm text-slate-300">
                    {historyCounts[user.id] ?? 0} total chores across all spins
                  </span>
                </div>
                <button
                  type="button"
                  className="pill-button bg-red-500/15 text-red-200"
                  onClick={() => removeUser(user.id)}
                  disabled={isSpinning}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">Work</p>
              <h2 className="text-2xl font-semibold text-slate-50">Chores</h2>
            </div>
            <span className="rounded-full bg-purple-400/15 px-3 py-1.5 text-sm font-medium text-purple-200">
              {chores.length}
            </span>
          </div>

          <form className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={addChore}>
            <input
              className="rounded-2xl border border-slate-400/20 bg-slate-900/40 px-4 py-3 text-slate-50 outline-none transition focus:border-purple-400/60"
              value={choreName}
              onChange={(event) => setChoreName(event.target.value)}
              placeholder="Add a chore"
              aria-label="Chore name"
            />
            <button type="submit" className="pill-button bg-emerald-500/20 text-emerald-200">
              Add
            </button>
          </form>

          <ul className="flex list-none flex-col gap-3 p-0">
            {chores.map((chore) => {
              const isAssigned = assignments.some((assignment) => assignment.choreId === chore.id)

              return (
                <li
                  key={chore.id}
                  className={[
                    'flex flex-col gap-4 rounded-2xl border border-slate-400/15 bg-slate-800/70 p-4 sm:flex-row sm:items-center sm:justify-between',
                    isAssigned ? 'border-emerald-500/35' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div>
                    <strong className="text-slate-50">{chore.name}</strong>
                    <span className="mt-1 block text-sm text-slate-300">
                      {isAssigned ? 'Assigned this round' : 'Waiting for doom'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="pill-button bg-red-500/15 text-red-200"
                    onClick={() => removeChore(chore.id)}
                    disabled={isSpinning}
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="glass-panel flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-400">Wheel</p>
              <h2 className="text-2xl font-semibold text-slate-50">Delegation board</h2>
            </div>
            <span className="rounded-full bg-purple-400/15 px-3 py-1.5 text-sm font-medium text-purple-200">
              {assignmentRows.length}
            </span>
          </div>

          <div className="rounded-3xl border border-slate-400/15 bg-[radial-gradient(circle_at_top,rgba(192,132,252,0.24),transparent_55%),rgba(15,23,42,0.5)] p-5">
            <div className="grid min-h-60 gap-3 sm:grid-cols-2">
              {users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="contents"
                  >
                    <span
                      className={[
                        'flex min-h-[5.5rem] items-center justify-center rounded-3xl border border-transparent bg-slate-700/70 px-4 text-center text-slate-200 transition duration-200',
                        activeUserId === user.id
                          ? 'scale-[1.02] border-orange-400/85 bg-gradient-to-br from-orange-500/30 to-purple-400/30'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {user.name}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex min-h-[5.5rem] items-center justify-center rounded-3xl bg-slate-700/70 px-4 text-center text-slate-300 sm:col-span-2">
                  Add a user to build the wheel.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-semibold text-slate-50">This round</h3>
            <ul className="flex list-none flex-col gap-3 p-0">
              {assignmentRows.length > 0 ? (
                assignmentRows.map((assignment) => (
                  <li
                    key={assignment.choreId}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-400/15 bg-slate-800/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-slate-300">{assignment.choreName}</span>
                    <strong className="text-slate-50">{assignment.userName}</strong>
                  </li>
                ))
              ) : (
                <li className="flex justify-center rounded-2xl border border-slate-400/15 bg-slate-800/70 p-4 text-slate-400">
                  No assignments yet. Spin when ready.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
