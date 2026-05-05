import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import AppShell from './components/AppShell'
import AssignmentsPanel from './components/AssignmentsPanel'
import ChoreListPanel from './components/ChoreListPanel'
import DoomDomeSection from './components/DoomDomeSection'
import EditableListPanel from './components/EditableListPanel'
import FairnessRadar from './components/FairnessRadar'
import NavigationTabs, { type NavigationView } from './components/NavigationTabs'
import {
  STORAGE_KEY,
  chooseFairestAssignments,
  createDefaultState,
  getStoredState,
} from './lib/app-state'
import { CarnivalAudio } from './lib/carnivalAudio'
import type { Assignment, Chore, ChoreHistoryStats, HistoryStats, PersistedState, User } from './types/app'

function App() {
  const carnivalAudioRef = useRef<CarnivalAudio | null>(null)
  const [initialState] = useState<PersistedState>(() => getStoredState())
  const [users, setUsers] = useState<User[]>(initialState.users)
  const [chores, setChores] = useState<Chore[]>(initialState.chores)
  const [assignments, setAssignments] = useState<Assignment[]>(initialState.assignments)
  const [historyCounts, setHistoryCounts] = useState<HistoryStats>(initialState.historyCounts)
  const [choreHistoryCounts, setChoreHistoryCounts] = useState<ChoreHistoryStats>(initialState.choreHistoryCounts)
  const [userName, setUserName] = useState('')
  const [choreName, setChoreName] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
  const [isReelSpinning, setIsReelSpinning] = useState(false)
  const [activeUserId, setActiveUserId] = useState<string | null>(null)
  const [currentChoreId, setCurrentChoreId] = useState<string | null>(null)
  const [confettiBurstKey, setConfettiBurstKey] = useState(0)
  const [activeView, setActiveView] = useState<NavigationView>('users')
  const [message, setMessage] = useState('Summon the cast, feed the wheel, and unleash chore destiny.')

  useEffect(() => {
    const sanitizedCounts = users.reduce<HistoryStats>((acc, user) => {
      acc[user.id] = historyCounts[user.id] ?? 0
      return acc
    }, {})
    const sanitizedChoreHistoryCounts = chores.reduce<ChoreHistoryStats>((acc, chore) => {
      acc[chore.id] = users.reduce<HistoryStats>((userAcc, user) => {
        userAcc[user.id] = choreHistoryCounts[chore.id]?.[user.id] ?? 0
        return userAcc
      }, {})

      return acc
    }, {})

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        users,
        chores,
        assignments,
        historyCounts: sanitizedCounts,
        choreHistoryCounts: sanitizedChoreHistoryCounts,
      }),
    )
  }, [users, chores, assignments, historyCounts, choreHistoryCounts])

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

  const enabledUsers = useMemo(() => users.filter((user) => !user.disabled), [users])
  const enabledChores = useMemo(() => chores.filter((chore) => !chore.disabled), [chores])

  const remainingChores = useMemo(() => {
    const assigned = new Set(assignments.map((assignment) => assignment.choreId))
    return enabledChores.filter((chore) => !assigned.has(chore.id))
  }, [assignments, enabledChores])

  const canSpin = enabledUsers.length > 0 && remainingChores.length > 0 && !isSpinning
  const hasUsers = users.length > 0
  const hasChores = chores.length > 0

  const addUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = userName.trim()

    if (!trimmed) return

    const newUser = { id: crypto.randomUUID(), name: trimmed, disabled: false }
    setUsers((current) => [...current, newUser])
    setHistoryCounts((current) => ({ ...current, [newUser.id]: 0 }))
    setChoreHistoryCounts((current) => {
      const next = { ...current }

      for (const chore of chores) {
        next[chore.id] = {
          ...next[chore.id],
          [newUser.id]: 0,
        }
      }

      return next
    })
    setUserName('')
  }

  const addChore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = choreName.trim()

    if (!trimmed) return

    const newChore = { id: crypto.randomUUID(), name: trimmed, disabled: false }
    setChores((current) => [...current, newChore])
    setChoreHistoryCounts((current) => ({
      ...current,
      [newChore.id]: users.reduce<HistoryStats>((acc, user) => {
        acc[user.id] = 0
        return acc
      }, {}),
    }))
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
    setChoreHistoryCounts((current) => {
      const next = Object.fromEntries(
        Object.entries(current).map(([choreId, counts]) => {
          const nextCounts = { ...counts }
          delete nextCounts[userId]
          return [choreId, nextCounts]
        }),
      ) as ChoreHistoryStats

      return next
    })

    if (activeUserId === userId) {
      setActiveUserId(null)
    }
  }

  const toggleUserDisabled = (userId: string) => {
    setUsers((current) => current.map((user) => (user.id === userId ? { ...user, disabled: !user.disabled } : user)))

    if (activeUserId === userId) {
      setActiveUserId(null)
    }
  }

  const removeChore = (choreId: string) => {
    setChores((current) => current.filter((chore) => chore.id !== choreId))
    setAssignments((current) => current.filter((assignment) => assignment.choreId !== choreId))
    setChoreHistoryCounts((current) => {
      const next = { ...current }
      delete next[choreId]
      return next
    })

    if (currentChoreId === choreId) {
      setCurrentChoreId(null)
    }
  }

  const toggleChoreDisabled = (choreId: string) => {
    setChores((current) => current.map((chore) => (chore.id === choreId ? { ...chore, disabled: !chore.disabled } : chore)))

    if (currentChoreId === choreId) {
      setCurrentChoreId(null)
    }
  }

  const runSpin = async () => {
    if (enabledUsers.length === 0) {
      setMessage(
        users.length === 0
          ? 'No contestants. Add at least one mortal before the spectacle begins.'
          : 'All users are disabled for this round. Enable at least one to spin the wheel.',
      )
      return
    }

    if (remainingChores.length === 0) {
      setMessage(
        enabledChores.length === 0 && chores.length > 0
          ? 'All chores are disabled for this round. Enable one to put it back on the wheel.'
          : 'Every chore already has an unfortunate champion. Reset the round for encore chaos.',
      )
      return
    }

    if (!carnivalAudioRef.current) {
      carnivalAudioRef.current = new CarnivalAudio()
    }

    setIsSpinning(true)
    setIsReelSpinning(true)
    setMessage('⚡ The arena awakens. Lights flash. Fate starts screaming...')

    let nextCounts = { ...historyCounts }
    let nextChoreCounts = { ...choreHistoryCounts }
    const roundAssignments = chooseFairestAssignments(
      remainingChores,
      enabledUsers,
      nextCounts,
      nextChoreCounts,
      assignments,
      enabledChores,
    )
    const producedAssignments: Assignment[] = []

    try {
      for (const chore of remainingChores) {
        setCurrentChoreId(chore.id)
        setIsReelSpinning(true)
        setMessage(`🎯 ${chore.name} enters the thunder dome. Choose wisely, cruel machine.`)
        await carnivalAudioRef.current.start()

        for (let tick = 0; tick < 12; tick += 1) {
          const highlighted = enabledUsers[tick % enabledUsers.length]
          setActiveUserId(highlighted.id)
          await new Promise((resolve) => window.setTimeout(resolve, 85 + tick * 16))
        }

        const nextAssignment = roundAssignments.find((assignment) => assignment.choreId === chore.id)
        const chosenUser = nextAssignment ? enabledUsers.find((user) => user.id === nextAssignment.userId) : null

        if (!nextAssignment || !chosenUser) {
          throw new Error('Could not resolve batch assignment')
        }

        setActiveUserId(chosenUser.id)
        setIsReelSpinning(false)
        carnivalAudioRef.current?.stop()
        await carnivalAudioRef.current?.playBell()

        producedAssignments.push(nextAssignment)
        nextCounts = {
          ...nextCounts,
          [chosenUser.id]: (nextCounts[chosenUser.id] ?? 0) + 1,
        }
        nextChoreCounts = {
          ...nextChoreCounts,
          [chore.id]: {
            ...nextChoreCounts[chore.id],
            [chosenUser.id]: (nextChoreCounts[chore.id]?.[chosenUser.id] ?? 0) + 1,
          },
        }

        setAssignments((current) => [...current, nextAssignment])
        setHistoryCounts(nextCounts)
        setChoreHistoryCounts(nextChoreCounts)
        setConfettiBurstKey((current) => current + 1)
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
    setChoreHistoryCounts(freshState.choreHistoryCounts)
    setCurrentChoreId(null)
    setActiveUserId(null)
    setIsSpinning(false)
    setIsReelSpinning(false)
    setMessage('Everything has been reset. The arena is empty until you add users and chores.')
  }

  useEffect(() => {
    if (users.length > 0 && enabledUsers.length === 0) {
      setMessage('All users are disabled for this round. Enable at least one to spin the wheel.')
      return
    }

    if (chores.length > 0 && enabledChores.length === 0) {
      setMessage('All chores are disabled for this round. Enable one to put it back on the wheel.')
    }
  }, [chores.length, enabledChores.length, enabledUsers.length, users.length])

  const currentChoreName = currentChoreId
    ? chores.find((chore) => chore.id === currentChoreId)?.name ?? 'Finding victim…'
    : remainingChores[0]?.name ?? (enabledChores.length === 0 && chores.length > 0 ? 'No enabled chores' : 'All chores assigned')

  const assignmentChoreIds = new Set(assignments.map((assignment) => assignment.choreId))
  const userItems = users.map((user) => ({
    id: user.id,
    name: user.name,
    meta: user.disabled
      ? `${historyCounts[user.id] ?? 0} total chores across all spins · disabled for this round`
      : `${historyCounts[user.id] ?? 0} total chores across all spins`,
    disabled: user.disabled,
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
    {
      id: 'fairness' as const,
      label: 'Fairness',
      badge: users.length,
      ready: hasUsers && hasChores,
      step: 4,
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
            onToggleDisabled={toggleUserDisabled}
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
            onToggleDisabled={toggleChoreDisabled}
            onSubmit={addChore}
            value={choreName}
          />
        </section>
      )
    }

    if (activeView === 'fairness') {
      return (
        <section className="w-full">
          <FairnessRadar
            chores={chores}
            choreHistoryCounts={choreHistoryCounts}
            historyCounts={historyCounts}
            users={users}
          />
        </section>
      )
    }

    return (
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr] xl:items-start">
        <DoomDomeSection
          activeUserId={activeUserId}
          canSpin={canSpin}
          confettiBurstKey={confettiBurstKey}
          currentChoreName={currentChoreName}
          idleHint={
            users.length === 0
              ? 'Add users to load the reel'
              : enabledUsers.length === 0
                ? 'All users are disabled for this round'
                : 'Ready for chaos'
          }
          isSpinning={isSpinning}
          isReelSpinning={isReelSpinning}
          message={message}
          onResetRound={resetRound}
          onRunSpin={runSpin}
          users={enabledUsers}
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
