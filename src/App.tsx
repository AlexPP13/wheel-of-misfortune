import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import AppShell from './components/AppShell'
import AssignmentsPanel from './components/AssignmentsPanel'
import ChoreListPanel from './components/ChoreListPanel'
import DoomDomeSection from './components/DoomDomeSection'
import EditableListPanel from './components/EditableListPanel'
import NavigationTabs from './components/NavigationTabs'
import {
  STORAGE_KEY,
  chooseFairestUser,
  createDefaultState,
  getStoredState,
} from './lib/app-state'
import { CarnivalAudio } from './lib/carnivalAudio'
import type { Assignment, Chore, HistoryStats, PersistedState, User } from './types/app'

type AppView = 'play' | 'chores' | 'users'

function App() {
  const carnivalAudioRef = useRef<CarnivalAudio | null>(null)
  const [initialState] = useState<PersistedState>(() => getStoredState())
  const [users, setUsers] = useState<User[]>(initialState.users)
  const [chores, setChores] = useState<Chore[]>(initialState.chores)
  const [assignments, setAssignments] = useState<Assignment[]>(initialState.assignments)
  const [historyCounts, setHistoryCounts] = useState<HistoryStats>(initialState.historyCounts)
  const [userName, setUserName] = useState('')
  const [choreName, setChoreName] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [isReelSpinning, setIsReelSpinning] = useState(false)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [currentChoreId, setCurrentChoreId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<AppView>('users')
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

  useEffect(() => {
    return () => {
      void carnivalAudioRef.current?.dispose()
      carnivalAudioRef.current = null
    }
  }, [])

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
  const hasUsers = users.length > 0
  const hasChores = chores.length > 0

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

    if (!carnivalAudioRef.current) {
      carnivalAudioRef.current = new CarnivalAudio()
    }

    setIsSpinning(true)
    setIsReelSpinning(true)
    setMessage('⚡ The arena awakens. Lights flash. Fate starts screaming...')

    let nextCounts = { ...historyCounts }
    const producedAssignments: Assignment[] = []

    try {
      for (const chore of remainingChores) {
        setCurrentChoreId(chore.id)
        setIsReelSpinning(true)
        setMessage(`🎯 ${chore.name} enters the thunder dome. Choose wisely, cruel machine.`)
        await carnivalAudioRef.current.start()

        for (let tick = 0; tick < 12; tick += 1) {
          const highlighted = users[tick % users.length]
          setActiveUserId(highlighted.id)
          await new Promise((resolve) => window.setTimeout(resolve, 85 + tick * 16))
        }

        const chosenUser = chooseFairestUser(users, nextCounts)
        setActiveUserId(chosenUser.id)
        setIsReelSpinning(false)
        carnivalAudioRef.current?.stop()
        await carnivalAudioRef.current?.playBell()

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
    } finally {
      carnivalAudioRef.current?.stop()
      setCurrentChoreId(null)
      setIsSpinning(false)
      setIsReelSpinning(false)
      setMessage(
        producedAssignments.length > 0
          ? '👑 The wheel has spoken. Every chore has found its doomed star.'
          : 'Nothing left to assign this round.',
      )
    }
  }

  const resetRound = () => {
    carnivalAudioRef.current?.stop()
    setAssignments([])
    setCurrentChoreId(null)
    setActiveUserId(null)
    setIsSpinning(false)
    setIsReelSpinning(false)
    setMessage('Round wiped clean. The crowd demands another overproduced catastrophe.')
  }

  const resetEverything = () => {
    carnivalAudioRef.current?.stop()
    localStorage.removeItem(STORAGE_KEY)
    const freshState = createDefaultState()

    setUsers(freshState.users)
    setChores(freshState.chores)
    setAssignments(freshState.assignments)
    setHistoryCounts(freshState.historyCounts)
    setCurrentChoreId(null)
    setActiveUserId(null)
    setIsSpinning(false)
    setIsReelSpinning(false)
    setMessage('Everything has been reset. The arena is empty until you add users and chores.')
  }

  const currentChoreName = currentChoreId
    ? chores.find((chore) => chore.id === currentChoreId)?.name ?? 'Finding victim…'
    : remainingChores[0]?.name ?? 'All chores assigned'

  const assignmentChoreIds = new Set(assignments.map((assignment) => assignment.choreId))
  const userItems = users.map((user) => ({
    id: user.id,
    name: user.name,
    meta: `${historyCounts[user.id] ?? 0} total chores across all spins`,
    highlighted: activeUserId === user.id,
  }))
  const viewItems = [
    {
      id: 'users' as const,
      label: 'Users',
      badge: users.length,
      ready: hasUsers,
      step: 1,
    },
    {
      id: 'chores' as const,
      label: 'Chores',
      badge: chores.length,
      ready: hasChores,
      step: 2,
    },
    {
      id: 'play' as const,
      label: 'Play',
      badge: assignments.length,
      ready: hasUsers && hasChores,
      step: 3,
    },
  ]

  const renderActiveView = () => {
    if (activeView === 'users') {
      return (
        <section className="w-full">
          <EditableListPanel
            buttonLabel="Add"
            count={users.length}
            disabled={isSpinning}
            inputLabel="User name"
            inputPlaceholder="Add a contestant"
            items={userItems}
            onInputChange={setUserName}
            onRemove={removeUser}
            onSubmit={addUser}
            panelLabel="Step 1 · roster"
            title="Users"
            value={userName}
          />
        </section>
      )
    }

    if (activeView === 'chores') {
      return (
        <section className="w-full">
          <ChoreListPanel
            assignmentsChoreIds={assignmentChoreIds}
            chores={chores}
            disabled={isSpinning}
            onInputChange={setChoreName}
            onRemove={removeChore}
            onSubmit={addChore}
            value={choreName}
          />
        </section>
      )
    }

    return (
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr] xl:items-start">
        <DoomDomeSection
          activeUserId={activeUserId}
          canSpin={canSpin}
          currentChoreName={currentChoreName}
          isSpinning={isSpinning}
          isReelSpinning={isReelSpinning}
          message={message}
          onResetRound={resetRound}
          onRunSpin={runSpin}
          users={users}
        />
        <AssignmentsPanel assignmentRows={assignmentRows} />
      </section>
    )
  }

  return (
    <AppShell>
      <NavigationTabs
        activeView={activeView}
        items={viewItems}
        onChange={setActiveView}
        onResetEverything={resetEverything}
      />
      {renderActiveView()}
    </AppShell>
  )
}

export default App
