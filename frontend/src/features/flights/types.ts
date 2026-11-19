import { z } from 'zod'

export const flightSchema = z.object({
  id: z.number().int(),
  flightNumber: z.string(),
  origin: z.string(),
  destination: z.string(),
  departsAt: z.iso.datetime({ offset: true }),
  capacity: z.number().int().positive(),
  registeredPassengers: z.number().int().nonnegative(),
  availableSeats: z.number().int().nonnegative(),
  isFull: z.boolean(),
})

export const passengerSchema = z.object({
  id: z.uuid(),
  flightId: z.number().int(),
  fullName: z.string(),
  documentNumber: z.string(),
  registeredAt: z.iso.datetime({ offset: true }),
})

export const flightsSchema = z.array(flightSchema)
export const passengersSchema = z.array(passengerSchema)

export type Flight = z.infer<typeof flightSchema>
export type Passenger = z.infer<typeof passengerSchema>
export type { RegisterPassengerInput } from './schemas/registerPassengerSchema'
