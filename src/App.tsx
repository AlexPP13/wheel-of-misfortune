import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

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

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Wheel of (Un)Fortune</p>
          <h1>Spin the wheel, spread the suffering fairly.</h1>
          <p className="hero-copy">
            Add your people, list the chores, and let the app assign every task exactly once.
            Across multiple rounds, local history keeps the workload balanced.
          </p>
        </div>

        <div className="hero-actions">
          <button className="primary-button" onClick={runSpin} disabled={!canSpin}>
            {isSpinning ? 'Spinning…' : remainingChores.length === 0 ? 'All tasks assigned' : 'Spin the wheel'}
          </button>
          <button className="secondary-button" onClick={resetRound} disabled={isSpinning}>
            Reset round
          </button>
          <button className="ghost-button" onClick={resetEverything} disabled={isSpinning}>
            Reset everything
          </button>
        </div>
      </section>

      <section className="status-bar">
        <div>
          <span className="status-label">Current chore</span>
          <strong>
            {currentChoreId
              ? chores.find((chore) => chore.id === currentChoreId)?.name ?? 'Finding victim…'
              : remainingChores[0]?.name ?? 'All chores assigned'}
          </strong>
        </div>
        <div>
          <span className="status-label">Round progress</span>
          <strong>
            {assignments.length} / {chores.length} chores delegated
          </strong>
        </div>
        <p className="status-message">{message}</p>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Crew</p>
              <h2>Users</h2>
            </div>
            <span className="pill">{users.length}</span>
          </div>

          <form className="entry-form" onSubmit={addUser}>
            <input
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Add a user"
              aria-label="User name"
            />
            <button type="submit">Add</button>
          </form>

          <ul className="item-list">
            {users.map((user) => (
              <li
                key={user.id}
                className={['item-card', activeUserId === user.id ? 'active' : ''].filter(Boolean).join(' ')}
              >
                <div>
                  <strong>{user.name}</strong>
                  <span>{historyCounts[user.id] ?? 0} total chores across all spins</span>
                </div>
                <button type="button" onClick={() => removeUser(user.id)} disabled={isSpinning}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Work</p>
              <h2>Chores</h2>
            </div>
            <span className="pill">{chores.length}</span>
          </div>

          <form className="entry-form" onSubmit={addChore}>
            <input
              value={choreName}
              onChange={(event) => setChoreName(event.target.value)}
              placeholder="Add a chore"
              aria-label="Chore name"
            />
            <button type="submit">Add</button>
          </form>

          <ul className="item-list">
            {chores.map((chore) => {
              const isAssigned = assignments.some((assignment) => assignment.choreId === chore.id)

              return (
                <li key={chore.id} className={['item-card', isAssigned ? 'assigned' : ''].filter(Boolean).join(' ')}>
                  <div>
                    <strong>{chore.name}</strong>
                    <span>{isAssigned ? 'Assigned this round' : 'Waiting for doom'}</span>
                  </div>
                  <button type="button" onClick={() => removeChore(chore.id)} disabled={isSpinning}>
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="panel results-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Wheel</p>
              <h2>Delegation board</h2>
            </div>
            <span className="pill">{assignmentRows.length}</span>
          </div>

          <div className="wheel-card">
            <div className="wheel-ring">
              {users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className={['wheel-slot', activeUserId === user.id ? 'selected' : '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {user.name}
                  </div>
                ))
              ) : (
                <div className="wheel-empty">Add a user to build the wheel.</div>
              )}
            </div>
          </div>

          <div className="results-section">
            <h3>This round</h3>
            <ul className="results-list">
              {assignmentRows.length > 0 ? (
                assignmentRows.map((assignment) => (
                  <li key={assignment.choreId}>
                    <span>{assignment.choreName}</span>
                    <strong>{assignment.userName}</strong>
                  </li>
                ))
              ) : (
                <li className="empty-state">No assignments yet. Spin when ready.</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
