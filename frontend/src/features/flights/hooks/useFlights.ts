import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listFlights, listPassengers, registerPassenger } from '../api/flightsApi'
import type { RegisterPassengerInput } from '../types'

export const LIVE_REFRESH_MS = 30_000

export function useFlights() {
  return useQuery({
    queryKey: ['flights'],
    queryFn: ({ signal }) => listFlights(signal),
    refetchInterval: LIVE_REFRESH_MS,
  })
}

export function useFlightPassengers(flightId: number) {
  return useQuery({
    queryKey: ['flights', flightId, 'passengers'],
    queryFn: ({ signal }) => listPassengers(flightId, signal),
    refetchInterval: LIVE_REFRESH_MS,
  })
}

export function useRegisterPassenger(flightId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterPassengerInput) => registerPassenger(flightId, input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['flights'] }),
  })
}
