export interface Flight {
  id: number
  flightNumber: string
  origin: string
  destination: string
  departsAt: string
  capacity: number
  registeredPassengers: number
  availableSeats: number
  isFull: boolean
}

export interface Passenger {
  id: string
  flightId: number
  fullName: string
  documentNumber: string
  registeredAt: string
}

export interface RegisterPassengerInput {
  fullName: string
  documentNumber: string
}
