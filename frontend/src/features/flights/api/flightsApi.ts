import { request } from '../../../shared/api/httpClient'
import type { Flight, Passenger, RegisterPassengerInput } from '../types'

export const listFlights = (signal?: AbortSignal) => request<Flight[]>('/api/v1/flights', { signal })

export const listPassengers = (flightId: number, signal?: AbortSignal) =>
  request<Passenger[]>(`/api/v1/flights/${flightId}/passengers`, { signal })

export const registerPassenger = (flightId: number, input: RegisterPassengerInput) =>
  request<Passenger>(`/api/v1/flights/${flightId}/passengers`, { method: 'POST', body: input })
