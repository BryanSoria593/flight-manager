import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../shared/api/ApiError'
import { listFlights, listPassengers, registerPassenger } from '../api/flightsApi'
import type { RegisterPassengerInput } from '../types'

export function useFlights() {
  return useQuery({ queryKey: ['flights'], queryFn: ({ signal }) => listFlights(signal) })
}

export function useFlightPassengers(flightId: number) {
  return useQuery({
    queryKey: ['flights', flightId, 'passengers'],
    queryFn: ({ signal }) => listPassengers(flightId, signal),
  })
}

export function useRegisterPassenger(flightId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RegisterPassengerInput) => registerPassenger(flightId, input),
    onSettled: (_data, error) => {
      if (!error || (error instanceof ApiError && error.status === 409)) {
        return queryClient.invalidateQueries({ queryKey: ['flights'] })
      }
    },
  })
}
