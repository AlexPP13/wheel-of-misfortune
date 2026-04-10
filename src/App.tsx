import { type FormEvent, useEffect, useMemo, useState } from 'react'
import AppShell from './components/AppShell'
import AssignmentsPanel from './components/AssignmentsPanel'
import ChoreListPanel from './components/ChoreListPanel'
import DoomDomeSection from './components/DoomDomeSection'
import EditableListPanel from './components/EditableListPanel'
import FairnessRadar from './components/FairnessRadar'
import HeroSection from './components/HeroSection'
import NavigationTabs from './components/NavigationTabs'
import ViewSpotlight from './components/ViewSpotlight'
import {
  STORAGE_KEY,
  chooseFairestUser,
  createDefaultChores,
  createDefaultUsers,
  getStoredState,
} from './lib/app-state'
import type { Assignment, Chore, HistoryStats, PersistedState, User } from './types/app'

type AppView = 'play' | 'chores' | 'users'
const wizardOrder: AppView[] = ['users', 'chores', 'play']

function App() {
  const [initialState] = useState<PersistedState>(() => getStoredState())
  const [users, setUsers] = useState<User[]>(initialState.users)
  const [chores, setChores] = useState<Chore[]>(initialState.chores)
  const [assignments, setAssignments] = useState<Assignment[]>(initialState.assignments)
  const [historyCounts, setHistoryCounts] = useState<HistoryStats>(initialState.historyCounts)
  const [userName, setUserName] = useState('')
  const [choreName, setChoreName] = useState('')
  const [isSpinning, setIsSpinning] = useState(false)
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
  const hasUsers = users.length > 0
  const hasChores = chores.length > 0

  const goToNextStep = () => {
    const currentIndex = wizardOrder.indexOf(activeView)
    const nextView = wizardOrder[Math.min(currentIndex + 1, wizardOrder.length - 1)]
    setActiveView(nextView)
  }

  const goToPreviousStep = () => {
    const currentIndex = wizardOrder.indexOf(activeView)
    const previousView = wizardOrder[Math.max(currentIndex - 1, 0)]
    setActiveView(previousView)
  }

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
    const freshUsers = createDefaultUsers()
    const freshChores = createDefaultChores()

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
      caption: hasUsers ? 'Roster ready for the wheel' : 'Add at least one player',
      badge: users.length,
      ready: hasUsers,
      step: 1,
    },
    {
      id: 'chores' as const,
      label: 'Chores',
      caption: hasChores ? 'Task list loaded' : 'Add chores to assign',
      badge: chores.length,
      ready: hasChores,
      step: 2,
    },
    {
      id: 'play' as const,
      label: 'Play',
      caption: canSpin ? 'Ready to run the wheel' : 'Complete setup to spin',
      badge: assignments.length,
      ready: hasUsers && hasChores,
      step: 3,
    },
  ]

  const renderActiveView = () => {
    if (activeView === 'users') {
      return (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
          <div className="space-y-6">
            <ViewSpotlight
              eyebrow="Step 1"
              title="Choose who is entering the wheel."
              description="This is the first step in the flow. Everyone listed here becomes eligible for assignment later, and you can still come back from the play screen to edit the roster."
              actions={[
                {
                  label: 'Continue to chores',
                  onClick: goToNextStep,
                  tone: 'primary',
                },
              ]}
              stats={[
                { label: 'Active users', value: users.length },
                { label: 'Fairest leader', value: fairnessLeaders[0]?.name ?? 'Nobody yet' },
                { label: 'Top count', value: Math.max(0, ...users.map((user) => historyCounts[user.id] ?? 0)) },
              ]}
            />
            <FairnessRadar fairnessLeaders={fairnessLeaders} historyCounts={historyCounts} />
          </div>
        </section>
      )
    }

    if (activeView === 'chores') {
      return (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <ChoreListPanel
            assignmentsChoreIds={assignmentChoreIds}
            chores={chores}
            disabled={isSpinning}
            onInputChange={setChoreName}
            onRemove={removeChore}
            onSubmit={addChore}
            value={choreName}
          />
          <div className="space-y-6">
            <ViewSpotlight
              eyebrow="Step 2"
              title="Load the chores that the wheel can assign."
              description="This step defines the round. Add every chore you want in the draw, then move forward to the game screen. You can always jump back here with the stepper or the edit buttons."
              actions={[
                {
                  label: 'Back to users',
                  onClick: goToPreviousStep,
                },
                {
                  label: 'Continue to play',
                  onClick: goToNextStep,
                  tone: 'primary',
                },
              ]}
              stats={[
                { label: 'Queued chores', value: chores.length },
                { label: 'Still unassigned', value: remainingChores.length },
                { label: 'Locked this round', value: assignments.length },
              ]}
            />
            <AssignmentsPanel assignmentRows={assignmentRows} />
          </div>
        </section>
      )
    }

    return (
      <>
        <HeroSection
          assignedPercent={assignedPercent}
          assignmentsCount={assignments.length}
          canSpin={canSpin}
          isSpinning={isSpinning}
          message={message}
          onResetEverything={resetEverything}
          onResetRound={resetRound}
          onRunSpin={runSpin}
          remainingChoresCount={remainingChores.length}
          usersCount={users.length}
        />
        <section className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <DoomDomeSection
            activeUserId={activeUserId}
            currentChoreName={currentChoreName}
            fairnessRank={fairnessRank}
            historyCounts={historyCounts}
            isSpinning={isSpinning}
            users={users}
          />
          <FairnessRadar fairnessLeaders={fairnessLeaders} historyCounts={historyCounts} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <AssignmentsPanel assignmentRows={assignmentRows} />
          <ViewSpotlight
            eyebrow="Step 3"
            title="Spin the wheel, then edit setup whenever needed."
            description="The game screen now acts as the final wizard step. Run the round here, or jump back to the earlier steps to change players and chores without losing the overall flow."
            actions={[
              {
                label: 'Edit users',
                onClick: () => setActiveView('users'),
              },
              {
                label: 'Edit chores',
                onClick: () => setActiveView('chores'),
              },
            ]}
            stats={[
              { label: 'Users ready', value: users.length },
              { label: 'Chores ready', value: chores.length },
              { label: 'Completion', value: `${assignedPercent}%` },
            ]}
          />
        </section>
      </>
    )
  }

  return (
    <AppShell>
      <NavigationTabs activeView={activeView} items={viewItems} onChange={setActiveView} />
      {renderActiveView()}
    </AppShell>
  )
}

export default App
