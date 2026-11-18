import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithQueryClient } from '../../../test/utils'
import type { Flight } from '../types'
import { RegisterPassengerForm } from './RegisterPassengerForm'

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

describe('RegisterPassengerForm', () => {
  it('shows a clear message when the API answers Flight.Full', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(409, { status: 409, code: 'Flight.Full', detail: 'Flight FB-202 has reached its maximum capacity of 3 passengers.' }),
    )
    const user = userEvent.setup()
    renderWithQueryClient(<RegisterPassengerForm flight={flight} />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Ana Morales')
    await user.type(screen.getByLabelText(/documento/i), '1712345678')
    await user.click(screen.getByRole('button', { name: /registrar pasajero/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/lleno/i)
  })

  it('disables registration and explains why when the flight is full', () => {
    renderWithQueryClient(
      <RegisterPassengerForm flight={{ ...flight, registeredPassengers: 3, availableSeats: 0, isFull: true }} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/vuelo lleno/i)
    expect(screen.getByRole('button', { name: /registrar pasajero/i })).toBeDisabled()
  })
})
