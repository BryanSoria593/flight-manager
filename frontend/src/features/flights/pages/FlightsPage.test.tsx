import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithQueryClient } from '../../../test/utils'
import type { Flight } from '../types'
import { FlightsPage } from './FlightsPage'

const flight: Flight = {
  id: 2,
  flightNumber: 'FB-202',
  origin: 'Guayaquil',
  destination: 'Galápagos (Baltra)',
  departsAt: '2026-11-18T09:30:00-05:00',
  capacity: 3,
  registeredPassengers: 2,
  availableSeats: 1,
  isFull: false,
}

describe('FlightsPage', () => {
  it('lets the user retry after the flights fail to load', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(503, { status: 503, code: 'Server.SimulatedFailure' }))
      .mockResolvedValueOnce(jsonResponse(200, [flight]))
    const user = userEvent.setup()
    renderWithQueryClient(<FlightsPage />)

    await user.click(await screen.findByRole('button', { name: /reintentar/i }))

    expect(await screen.findByText('FB-202')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
