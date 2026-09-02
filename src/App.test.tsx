import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { STORAGE_KEY } from './lib/app-state'

function storePopulatedState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      users: [{ id: 'user-1', name: 'Ada', disabled: false }],
      chores: [{ id: 'chore-1', name: 'Dishes', disabled: false }],
      assignments: [{ userId: 'user-1', choreId: 'chore-1' }],
      historyCounts: { 'user-1': 3 },
      choreHistoryCounts: { 'chore-1': { 'user-1': 2 } },
    }),
  )
}

describe('App complete reset confirmation', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('does not reset stored state when confirmation is canceled', async () => {
    storePopulatedState()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    await userEvent.click(screen.getByRole('button', { name: 'Complete reset' }))

    expect(confirmSpy).toHaveBeenCalledWith(
      'This will delete all users, chores, assignments, and history. Continue?',
    )
    await userEvent.click(screen.getByRole('button', { name: /Users/ }))
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Ada')
  })

  it('resets stored state after confirmation', async () => {
    storePopulatedState()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }))
    await userEvent.click(screen.getByRole('button', { name: 'Complete reset' }))

    await waitFor(() => {
      expect(screen.queryByText('Ada')).not.toBeInTheDocument()
      expect(localStorage.getItem(STORAGE_KEY)).not.toContain('Ada')
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').resultSoundPreference).toBe('ka-ching')
    })
  })

  it('persists the selected result sound preference', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    await userEvent.click(screen.getByRole('radio', { name: 'Jackpot fanfare' }))

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').resultSoundPreference).toBe('jackpot-fanfare')
    })
  })
})
