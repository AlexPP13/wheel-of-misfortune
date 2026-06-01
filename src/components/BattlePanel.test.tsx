import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Assignment, AssignmentRow, Chore, User } from '../types/app'
import BattlePanel from './BattlePanel'

const users: User[] = [
  { id: 'user-1', name: 'Ada', disabled: false },
  { id: 'user-2', name: 'Grace', disabled: false },
]
const chores: Chore[] = [
  { id: 'chore-1', name: 'Dishes', disabled: false },
  { id: 'chore-2', name: 'Trash', disabled: false },
]
const assignments: Assignment[] = [
  { choreId: 'chore-1', userId: 'user-1' },
  { choreId: 'chore-2', userId: 'user-2' },
]
const assignmentRows: AssignmentRow[] = [
  { choreId: 'chore-1', choreName: 'Dishes', userId: 'user-1', userName: 'Ada' },
  { choreId: 'chore-2', choreName: 'Trash', userId: 'user-2', userName: 'Grace' },
]

describe('BattlePanel', () => {
  it('renders battle content and calls onRunBattle', async () => {
    const onRunBattle = vi.fn()
    const user = userEvent.setup()

    render(
      <BattlePanel
        assignments={assignments}
        assignmentRows={assignmentRows}
        chores={chores}
        onRunBattle={onRunBattle}
        users={users}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Random Battle' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start random battle' }))

    expect(onRunBattle).toHaveBeenCalledTimes(1)
  })

  it('disables battle button with fewer than two eligible assigned users', () => {
    render(
      <BattlePanel
        assignments={[assignments[0]]}
        assignmentRows={[assignmentRows[0]]}
        chores={chores}
        onRunBattle={vi.fn()}
        users={users}
      />,
    )

    expect(screen.getByRole('button', { name: 'Start random battle' })).toBeDisabled()
    expect(screen.getByText('At least two assigned users are needed for battle.')).toBeInTheDocument()
  })

  it('disables battle button when disabled', () => {
    render(
      <BattlePanel
        assignments={assignments}
        assignmentRows={assignmentRows}
        chores={chores}
        disabled
        onRunBattle={vi.fn()}
        users={users}
      />,
    )

    expect(screen.getByRole('button', { name: 'Start random battle' })).toBeDisabled()
  })

  it('displays last battle result', () => {
    render(
      <BattlePanel
        assignments={assignments}
        assignmentRows={assignmentRows}
        chores={chores}
        lastBattleResult={{
          winnerUserId: 'user-1',
          loserUserId: 'user-2',
          transferredChoreId: 'chore-1',
          keptChoreId: 'chore-2',
        }}
        onRunBattle={vi.fn()}
        users={users}
      />,
    )

    expect(screen.getByText('Winner:')).toBeInTheDocument()
    expect(screen.getByText('Loser:')).toBeInTheDocument()
    expect(screen.getByText(/Grace lost the battle and inherited Dishes/)).toBeInTheDocument()
  })
})
