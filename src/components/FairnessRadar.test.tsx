import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import FairnessRadar from './FairnessRadar'

describe('FairnessRadar audit trail', () => {
  it('shows each user’s delegation count for every task type', () => {
    render(
      <FairnessRadar
        users={[
          { id: 'ada', name: 'Ada', disabled: false },
          { id: 'ben', name: 'Ben', disabled: false },
        ]}
        chores={[
          { id: 'dishes', name: 'Dishes', disabled: false },
          { id: 'laundry', name: 'Laundry', disabled: false },
        ]}
        historyCounts={{ ada: 4, ben: 3 }}
        choreHistoryCounts={{
          dishes: { ada: 2, ben: 1 },
          laundry: { ada: 2, ben: 2 },
        }}
      />,
    )

    expect(screen.getByText('4 delegations across all rounds')).toBeInTheDocument()
    expect(screen.getByText('1 · 33%')).toBeInTheDocument()
    expect(screen.getByText('2 · 67%')).toBeInTheDocument()
    expect(screen.getAllByText('2 · 50%')).toHaveLength(2)
  })
})
