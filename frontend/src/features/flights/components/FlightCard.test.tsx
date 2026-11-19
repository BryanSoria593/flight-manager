import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Flight } from '../types'
import { FlightCard } from './FlightCard'

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

describe('FlightCard', () => {
  it('labels the final available seat', () => {
    render(<FlightCard flight={flight} selected={false} onSelect={() => {}} />)
    expect(screen.getByText('Último asiento')).toBeInTheDocument()
  })

  it('labels a full flight', () => {
    render(<FlightCard flight={{ ...flight, availableSeats: 0, isFull: true }} selected={false} onSelect={() => {}} />)
    expect(screen.getByText('Lleno')).toBeInTheDocument()
  })
})
