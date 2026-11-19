import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../../../test/utils'
import { LIVE_REFRESH_MS, useFlightPassengers, useFlights, useRegisterPassenger } from './useFlights'

const passenger = {
  id: '01a1f1c7-71a4-74af-a7f2-a50ce4587049',
  flightId: 2,
  fullName: 'Otro Usuario',
  documentNumber: 'OTRO11111',
  registeredAt: '2026-11-19T03:08:59.2421069+00:00',
}

const flight = {
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

describe('useFlights', () => {
  it.each([
    [404, 'Flight.NotFound'],
    [503, 'Server.Unexpected'],
  ])('refetches the flights after registration returns %i', async (status, code) => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(200, [flight]))
      .mockResolvedValueOnce(jsonResponse(status, { status, code }))
      .mockResolvedValueOnce(jsonResponse(200, []))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => ({ flights: useFlights(), registration: useRegisterPassenger(2) }), { wrapper })

    await waitFor(() => expect(result.current.flights.isSuccess).toBe(true))
    await act(async () => {
      await expect(result.current.registration.mutateAsync({ fullName: 'Ana Morales', documentNumber: '123456' })).rejects.toMatchObject({
        code,
      })
    })
    await waitFor(() => expect(fetchMock.mock.calls.filter(([input]) => String(input).endsWith('/api/v1/flights'))).toHaveLength(2))
  })
})

describe('useFlightPassengers', () => {
  it('refreshes on the same schedule as the flights, so a registration by someone else shows up', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(jsonResponse(200, []))
        .mockResolvedValueOnce(jsonResponse(200, [passenger]))
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      )
      const { result } = renderHook(() => useFlightPassengers(2), { wrapper })

      await waitFor(() => expect(result.current.data).toEqual([]))
      await act(() => vi.advanceTimersByTimeAsync(LIVE_REFRESH_MS))

      await waitFor(() => expect(result.current.data).toHaveLength(1))
    } finally {
      vi.useRealTimers()
    }
  })
})
