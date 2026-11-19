import { request } from '../../../shared/api/httpClient'
import { flightsSchema, passengerSchema, passengersSchema, type Flight, type Passenger, type RegisterPassengerInput } from '../types'

export const listFlights = (signal?: AbortSignal) => request<Flight[]>('/api/v1/flights', { signal, schema: flightsSchema })

export const listPassengers = (flightId: number, signal?: AbortSignal) =>
  request<Passenger[]>(`/api/v1/flights/${flightId}/passengers`, { signal, schema: passengersSchema })

export const registerPassenger = (flightId: number, input: RegisterPassengerInput) =>
  request<Passenger>(`/api/v1/flights/${flightId}/passengers`, { method: 'POST', body: input, schema: passengerSchema })
