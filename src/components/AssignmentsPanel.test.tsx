import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AssignmentRow, User } from '../types/app'
import AssignmentsPanel from './AssignmentsPanel'

const assignmentRows: AssignmentRow[] = [
  { choreId: 'chore-1', choreName: 'Dishes', userId: 'user-1', userName: 'Ada' },
]

const users: User[] = [
  { id: 'user-1', name: 'Ada', disabled: false },
  { id: 'user-2', name: 'Grace', disabled: false },
  { id: 'user-3', name: 'Linus', disabled: true },
]

describe('AssignmentsPanel switching', () => {
  it('renders switch controls and calls onSwitchAssignment with the selected user', async () => {
    const onSwitchAssignment = vi.fn()
    const user = userEvent.setup()

    render(
      <AssignmentsPanel
        assignmentRows={assignmentRows}
        onSwitchAssignment={onSwitchAssignment}
        users={users}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Switch Dishes to another user' }))
    const select = screen.getByRole('combobox', { name: 'Switch Dishes target user' })

    expect(screen.queryByRole('option', { name: 'Ada' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Linus' })).not.toBeInTheDocument()

    await user.selectOptions(select, 'user-2')

    expect(onSwitchAssignment).toHaveBeenCalledWith('chore-1', 'user-1', 'user-2')
  })

  it('disables switch controls when disabled', async () => {
    render(
      <AssignmentsPanel
        assignmentRows={assignmentRows}
        disabled
        onSwitchAssignment={vi.fn()}
        users={users}
      />,
    )

    expect(screen.getByRole('button', { name: 'Switch Dishes to another user' })).toBeDisabled()
  })

})
