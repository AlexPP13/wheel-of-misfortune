import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import ChoreListPanel from './ChoreListPanel'
import EditableListPanel from './EditableListPanel'
import NavigationTabs, { type NavigationView } from './NavigationTabs'

describe('EditableListPanel disabled controls', () => {
  it('disables input, submit, remove, and enable/disable buttons', () => {
    render(
      <EditableListPanel
        buttonLabel="Add"
        count={1}
        disabled
        inputLabel="User name"
        inputPlaceholder="Add a contestant"
        items={[{ id: 'user-1', name: 'Ada', meta: '0 chores', disabled: true }]}
        onInputChange={vi.fn()}
        onRemove={vi.fn()}
        onToggleDisabled={vi.fn()}
        onSubmit={vi.fn()}
        panelLabel="Step 1"
        title="Users"
        value=""
      />,
    )

    expect(screen.getByLabelText('User name')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enable' })).toBeDisabled()
  })
})

describe('ChoreListPanel disabled controls', () => {
  it('disables input, submit, remove, and enable/disable buttons', () => {
    render(
      <ChoreListPanel
        assignmentsChoreIds={new Set()}
        chores={[{ id: 'chore-1', name: 'Dishes', disabled: false }]}
        disabled
        onInputChange={vi.fn()}
        onRemove={vi.fn()}
        onToggleDisabled={vi.fn()}
        onSubmit={vi.fn()}
        value=""
      />,
    )

    expect(screen.getByLabelText('Chore name')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Disable' })).toBeDisabled()
  })
})

describe('NavigationTabs', () => {
  it('keeps settings in the header while tab navigation still works', async () => {
    const onChange = vi.fn<(view: NavigationView) => void>()

    render(
      <NavigationTabs
        activeView="users"
        items={[
          { id: 'users', label: 'Users', badge: 1, ready: true, step: 1 },
          { id: 'chores', label: 'Chores', badge: 1, ready: true, step: 2 },
          { id: 'play', label: 'Play', badge: 0, ready: true, step: 3 },
          { id: 'battle', label: 'Battle', badge: 0, ready: false, step: 4 },
          { id: 'fairness', label: 'Fairness', badge: 1, ready: true, step: 5 },
        ]}
        onChange={onChange}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(onChange).toHaveBeenCalledWith('settings')

    await userEvent.click(screen.getByRole('button', { name: /Chores/ }))

    expect(onChange).toHaveBeenCalledWith('chores')
  })
})
