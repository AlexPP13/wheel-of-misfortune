import { AnimatePresence, motion } from 'framer-motion'
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

const panelMotion = {
  hidden: { opacity: 0, y: 26, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
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

function getUserAura(index: number) {
  const auras = [
    'from-fuchsia-500/40 via-orange-400/25 to-yellow-300/20',
    'from-cyan-400/35 via-blue-500/20 to-violet-500/25',
    'from-emerald-400/35 via-lime-300/20 to-yellow-300/25',
    'from-rose-500/35 via-pink-400/25 to-fuchsia-400/20',
    'from-purple-500/35 via-indigo-400/20 to-sky-300/25',
  ]

  return auras[index % auras.length]
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
  const [message, setMessage] = useState('Summon the cast, feed the wheel, and unleash chore destiny.')

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

  const fairnessLeaders = useMemo(() => {
    return [...users]
      .sort((a, b) => (historyCounts[a.id] ?? 0) - (historyCounts[b.id] ?? 0))
      .slice(0, 3)
  }, [historyCounts, users])

  const fairnessRank = useMemo(() => {
    const ordered = [...users].sort((a, b) => (historyCounts[a.id] ?? 0) - (historyCounts[b.id] ?? 0))
    return Object.fromEntries(ordered.map((user, index) => [user.id, index + 1]))
  }, [historyCounts, users])

  const assignedPercent = chores.length > 0 ? Math.round((assignments.length / chores.length) * 100) : 0
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
      setMessage('No contestants. Add at least one mortal before the spectacle begins.')
      return
    }

    if (remainingChores.length === 0) {
      setMessage('Every chore already has an unfortunate champion. Reset the round for encore chaos.')
      return
    }

    setIsSpinning(true)
    setMessage('⚡ The arena awakens. Lights flash. Fate starts screaming...')

    let nextCounts = { ...historyCounts }
    const producedAssignments: Assignment[] = []

    for (const chore of remainingChores) {
      setCurrentChoreId(chore.id)
      setMessage(`🎯 ${chore.name} enters the thunder dome. Choose wisely, cruel machine.`)

      for (let tick = 0; tick < 12; tick += 1) {
        const highlighted = users[tick % users.length]
        setActiveUserId(highlighted.id)
        await new Promise((resolve) => window.setTimeout(resolve, 85 + tick * 16))
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
      setMessage(`🔥 ${chosenUser.name} has been dramatically volunteered for ${chore.name}.`)

      await new Promise((resolve) => window.setTimeout(resolve, 650))
    }

    setCurrentChoreId(null)
    setIsSpinning(false)
    setMessage(
      producedAssignments.length > 0
        ? '👑 The wheel has spoken. Every chore has found its doomed star.'
        : 'Nothing left to assign this round.',
    )
  }

  const resetRound = () => {
    setAssignments([])
    setCurrentChoreId(null)
    setActiveUserId(null)
    setIsSpinning(false)
    setMessage('Round wiped clean. The crowd demands another overproduced catastrophe.')
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
    setMessage('Everything has been reset. New victims. New chores. Same glorious chaos.')
  }

  const currentChoreName = currentChoreId
    ? chores.find((chore) => chore.id === currentChoreId)?.name ?? 'Finding victim…'
    : remainingChores[0]?.name ?? 'All chores assigned'

  const activeUser = activeUserId ? users.find((user) => user.id === activeUserId) ?? null : null

  return (
    <main className="relative isolate overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="aurora aurora-a" />
        <div className="aurora aurora-b" />
        <div className="aurora aurora-c" />
        <div className="grid-haze" />
      </div>

      <motion.section
        className="hero-panel mb-6 overflow-hidden p-6 sm:p-8 xl:p-10"
        initial="hidden"
        animate="visible"
        variants={panelMotion}
      >
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80" />
        <div className="relative z-10 grid gap-8 xl:grid-cols-[1.5fr_0.9fr] xl:items-center">
          <div>
            <motion.p
              className="mb-3 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.42em] text-fuchsia-100 shadow-[0_0_40px_rgba(255,255,255,0.12)]"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Wheel of (Un)Fortune · Deluxe Meltdown Edition
            </motion.p>

            <motion.h1
              className="max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-6xl xl:text-7xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
            >
              More thunder.
              <br />
              More neon.
              <br />
              More chore-fueled drama.
            </motion.h1>

            <motion.p
              className="mt-5 max-w-2xl text-base text-white/78 sm:text-lg"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.65 }}
            >
              This is no longer a polite productivity app. It is a glowing arena of assignment fate,
              where every spin feels like a season finale and every chore lands with theatrical excess.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.55 }}
            >
              <button className="dramatic-button dramatic-button-primary" onClick={runSpin} disabled={!canSpin}>
                {isSpinning ? 'Spinning the apocalypse…' : remainingChores.length === 0 ? 'All chores assigned' : 'Unleash the wheel'}
              </button>
              <button className="dramatic-button dramatic-button-muted" onClick={resetRound} disabled={isSpinning}>
                Reset round
              </button>
              <button className="dramatic-button dramatic-button-danger" onClick={resetEverything} disabled={isSpinning}>
                Reset everything
              </button>
            </motion.div>
          </div>

          <motion.div
            className="relative min-h-[20rem] rounded-[2rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_30px_120px_rgba(0,0,0,0.45)]"
            initial={{ opacity: 0, scale: 0.96, rotate: -1.5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.12, duration: 0.7 }}
          >
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.3),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.32),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">Showtime status</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">Chaos command board</h2>
                </div>
                <motion.div
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                  animate={isSpinning ? { scale: [1, 1.06, 1], opacity: [0.8, 1, 0.8] } : { scale: 1, opacity: 1 }}
                  transition={{ duration: 1.2, repeat: isSpinning ? Infinity : 0 }}
                >
                  {isSpinning ? 'LIVE' : 'ARMED'}
                </motion.div>
              </div>

              <div className="score-grid">
                <div className="score-tile">
                  <span>Total crew</span>
                  <strong>{users.length}</strong>
                </div>
                <div className="score-tile">
                  <span>Chores on deck</span>
                  <strong>{remainingChores.length}</strong>
                </div>
                <div className="score-tile">
                  <span>Assigned this round</span>
                  <strong>{assignments.length}</strong>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
                  <span>Round pressure</span>
                  <span>{assignedPercent}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#f97316_0%,#fb7185_28%,#a855f7_62%,#22d3ee_100%)] shadow-[0_0_30px_rgba(249,115,22,0.45)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${assignedPercent}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <p className="mt-3 text-sm text-white/72">{message}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <section className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <motion.div className="stage-panel overflow-hidden p-5 sm:p-6" initial="hidden" animate="visible" variants={panelMotion}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200/65">Main event</p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.03em] text-white sm:text-4xl">The doom dome</h2>
            </div>
            <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-white/86">
              Current chore: <span className="text-yellow-200">{currentChoreName}</span>
            </div>
          </div>

          <div className="arena-shell">
            <motion.div
              className="arena-ring arena-ring-outer"
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="arena-ring arena-ring-inner"
              animate={{ rotate: -360 }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            />

            <div className="arena-core">
              <motion.div
                className="spotlight-chip"
                animate={isSpinning ? { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] } : { scale: 1, opacity: 1 }}
                transition={{ duration: 0.95, repeat: isSpinning ? Infinity : 0 }}
              >
                {isSpinning ? 'SCANNING FOR A VOLUNTEER' : 'READY FOR IMPACT'}
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentChoreName}-${activeUser?.id ?? 'idle'}`}
                  className="text-center"
                  initial={{ opacity: 0, y: 18, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18, scale: 0.95 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/45">Now threatening</p>
                  <h3 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] text-white sm:text-5xl">
                    {currentChoreName}
                  </h3>
                  <p className="mt-4 text-sm text-white/72 sm:text-base">
                    {activeUser
                      ? `${activeUser.name} is currently in the spotlight.`
                      : 'Spin the machine and let the lasers decide.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {users.length > 0 ? (
                users.map((user, index) => {
                  const isActive = activeUserId === user.id
                  const choresTaken = historyCounts[user.id] ?? 0

                  return (
                    <motion.article
                      key={user.id}
                      className={[
                        'contestant-card',
                        isActive ? 'contestant-card-active' : '',
                        `bg-gradient-to-br ${getUserAura(index)}`,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={
                        isActive
                          ? {
                            opacity: 1,
                            y: 0,
                            scale: [1, 1.04, 1.01],
                            boxShadow: [
                              '0 0 0 rgba(255,255,255,0)',
                              '0 0 50px rgba(249,115,22,0.35)',
                              '0 0 26px rgba(168,85,247,0.28)',
                            ],
                          }
                          : { opacity: 1, y: 0, scale: 1 }
                      }
                      transition={{ duration: 0.45 }}
                    >
                      <div className="contestant-card__overlay" />
                      <div className="relative z-10 flex h-full flex-col justify-between gap-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/60">
                              Contestant {String(index + 1).padStart(2, '0')}
                            </p>
                            <h3 className="mt-3 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                              {user.name}
                            </h3>
                          </div>
                          <motion.span
                            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90"
                            animate={isActive ? { y: [-1, -6, -1] } : { y: 0 }}
                            transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
                          >
                            {isActive ? 'Chosen?' : 'Waiting'}
                          </motion.span>
                        </div>

                        <div className="space-y-2 text-sm text-white/82">
                          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
                            <span>Total chores survived</span>
                            <strong className="text-white">{choresTaken}</strong>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/18 px-3 py-2">
                            <span>Fairness rank</span>
                            <strong className="text-white">#{fairnessRank[user.id] ?? users.length}</strong>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  )
                })
              ) : (
                <motion.div className="empty-state md:col-span-2 xl:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Add a user and the arena will conjure contender cards.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.aside className="glass-panel p-5 sm:p-6" initial="hidden" animate="visible" variants={panelMotion}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/60">Fairness radar</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">Least doomed</h2>
            </div>
            <div className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100">
              Balanced chaos
            </div>
          </div>

          <div className="space-y-3">
            {fairnessLeaders.length > 0 ? (
              fairnessLeaders.map((user, index) => (
                <motion.div
                  key={user.id}
                  className="leader-row"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className="leader-rank">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-white">{user.name}</p>
                    <p className="text-sm text-white/58">{historyCounts[user.id] ?? 0} chores across all rounds</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="empty-state">Nobody on the board yet.</div>
            )}
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/6 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/52">Production notes</p>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li>• Every chore is assigned exactly once per round.</li>
              <li>• Historical counts still keep the pain distributed fairly.</li>
              <li>• The presentation is outrageous. The logic remains disciplined.</li>
            </ul>
          </div>
        </motion.aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <motion.div className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200/65">Roster control</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">Users</h2>
            </div>
            <span className="count-pill">{users.length}</span>
          </div>

          <form className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={addUser}>
            <input
              className="dramatic-input"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Add a contestant"
              aria-label="User name"
            />
            <button type="submit" className="dramatic-button dramatic-button-emerald">
              Add
            </button>
          </form>

          <div className="space-y-3">
            <AnimatePresence>
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  className={['list-card', activeUserId === user.id ? 'list-card-active' : ''].filter(Boolean).join(' ')}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <div>
                    <strong className="text-white">{user.name}</strong>
                    <span className="mt-1 block text-sm text-white/62">
                      {historyCounts[user.id] ?? 0} total chores across all spins
                    </span>
                  </div>
                  <button
                    type="button"
                    className="dramatic-button dramatic-button-danger dramatic-button-small"
                    onClick={() => removeUser(user.id)}
                    disabled={isSpinning}
                  >
                    Remove
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200/65">Threat queue</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">Chores</h2>
            </div>
            <span className="count-pill">{chores.length}</span>
          </div>

          <form className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={addChore}>
            <input
              className="dramatic-input"
              value={choreName}
              onChange={(event) => setChoreName(event.target.value)}
              placeholder="Add a catastrophe"
              aria-label="Chore name"
            />
            <button type="submit" className="dramatic-button dramatic-button-emerald">
              Add
            </button>
          </form>

          <div className="space-y-3">
            <AnimatePresence>
              {chores.map((chore) => {
                const isAssigned = assignments.some((assignment) => assignment.choreId === chore.id)

                return (
                  <motion.div
                    key={chore.id}
                    className={['list-card', isAssigned ? 'list-card-success' : ''].filter(Boolean).join(' ')}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                  >
                    <div>
                      <strong className="text-white">{chore.name}</strong>
                      <span className="mt-1 block text-sm text-white/62">
                        {isAssigned ? 'Assigned this round' : 'Waiting in the blast radius'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="dramatic-button dramatic-button-danger dramatic-button-small"
                      onClick={() => removeChore(chore.id)}
                      disabled={isSpinning}
                    >
                      Remove
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div className="glass-panel p-6" initial="hidden" animate="visible" variants={panelMotion}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-200/65">Aftermath</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">This round</h2>
            </div>
            <span className="count-pill">{assignmentRows.length}</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {assignmentRows.length > 0 ? (
                assignmentRows.map((assignment, index) => (
                  <motion.div
                    key={assignment.choreId}
                    className="assignment-card"
                    initial={{ opacity: 0, scale: 0.96, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/44">Assigned doom</p>
                      <strong className="mt-2 block text-lg text-white">{assignment.choreName}</strong>
                    </div>
                    <div className="assignment-winner">{assignment.userName}</div>
                  </motion.div>
                ))
              ) : (
                <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  No assignments yet. Press the big dramatic button.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </main>
  )
}

export default App
