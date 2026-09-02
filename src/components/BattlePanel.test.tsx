import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Chore, ChoreHistoryStats, User } from '../types/app'
import BattlePanel from './BattlePanel'

const users: User[] = [
  { id: 'user-1', name: 'Ada', disabled: false },
  { id: 'user-2', name: 'Grace', disabled: false },
]
const chores: Chore[] = [
  { id: 'chore-1', name: 'Dishes', disabled: false },
  { id: 'chore-2', name: 'Trash', disabled: false },
]
const choreHistoryCounts: ChoreHistoryStats = {
  'chore-1': { 'user-1': 2, 'user-2': 1 },
  'chore-2': { 'user-1': 1, 'user-2': 2 },
}

describe('BattlePanel', () => {
  it('submits task-history wagers for a 50 / 50 battle', async () => {
    const onRunBattle = vi.fn()
    const user = userEvent.setup()

    render(<BattlePanel choreHistoryCounts={choreHistoryCounts} chores={chores} foughtUserIds={[]} onRunBattle={onRunBattle} onToggleUser={vi.fn()} selectedUserIds={['user-1', 'user-2']} users={users} />)

    expect(screen.getByRole('heading', { name: 'History Battle' })).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Ada Dishes wager'))
    await user.type(screen.getByLabelText('Ada Dishes wager'), '2')
    await user.clear(screen.getByLabelText('Grace Trash wager'))
    await user.type(screen.getByLabelText('Grace Trash wager'), '1')
    await user.click(screen.getByRole('button', { name: 'Roll battle' }))

    expect(onRunBattle).toHaveBeenCalledWith([
      { userId: 'user-1', choreId: 'chore-1', amount: 2 },
      { userId: 'user-2', choreId: 'chore-2', amount: 1 },
    ])
  })

  it('requires both contestants to provide a wager', () => {
    render(<BattlePanel choreHistoryCounts={choreHistoryCounts} chores={chores} foughtUserIds={[]} onRunBattle={vi.fn()} onToggleUser={vi.fn()} selectedUserIds={['user-1', 'user-2']} users={users} />)

    expect(screen.getByRole('button', { name: 'Roll battle' })).toBeDisabled()
    expect(screen.getByText('Set at least one task-history wager for each contestant.')).toBeInTheDocument()
  })

  it('supports stepper, max, and all-in wager controls without native number inputs', async () => {
    const user = userEvent.setup()

    render(<BattlePanel choreHistoryCounts={choreHistoryCounts} chores={chores} foughtUserIds={[]} onRunBattle={vi.fn()} onToggleUser={vi.fn()} selectedUserIds={['user-1', 'user-2']} users={users} />)

    await user.click(screen.getByRole('button', { name: 'Increase Ada Dishes wager' }))
    expect(screen.getByLabelText('Ada Dishes wager')).toHaveValue('1')
    await user.click(screen.getByRole('button', { name: 'Decrease Ada Dishes wager' }))
    expect(screen.getByLabelText('Ada Dishes wager')).toHaveValue('0')
    await user.click(screen.getAllByRole('button', { name: 'Max' })[0])
    expect(screen.getByLabelText('Ada Dishes wager')).toHaveValue('2')
    await user.click(screen.getAllByRole('button', { name: 'All-in' })[0])
    expect(screen.getByLabelText('Ada Dishes wager')).toHaveValue('2')
    expect(screen.getByLabelText('Ada Trash wager')).toHaveValue('1')
    expect(screen.getByLabelText('Ada Dishes wager')).toHaveAttribute('type', 'text')
  })

  it('toggles available contestants and excludes contestants who already battled', async () => {
    const onToggleUser = vi.fn()
    const user = userEvent.setup()

    render(<BattlePanel choreHistoryCounts={choreHistoryCounts} chores={chores} foughtUserIds={['user-1']} onRunBattle={vi.fn()} onToggleUser={onToggleUser} selectedUserIds={[]} users={users} />)

    expect(screen.queryByLabelText(/Ada/)).not.toBeInTheDocument()
    await user.click(screen.getByLabelText(/Grace/))
    expect(onToggleUser).toHaveBeenCalledWith('user-2')
  })

  it('displays the exact transferred task history after a battle', () => {
    render(<BattlePanel choreHistoryCounts={choreHistoryCounts} chores={chores} foughtUserIds={['user-1', 'user-2']} lastBattleResult={{ winnerUserId: 'user-1', loserUserIds: ['user-2'], transferredWagers: [{ userId: 'user-2', choreId: 'chore-2', amount: 2 }] }} onRunBattle={vi.fn()} onToggleUser={vi.fn()} selectedUserIds={[]} users={users} />)

    expect(screen.getByText(/Ada has decreased their odds of being assigned Trash/)).toBeInTheDocument()
  })
})
