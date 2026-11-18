import type { Flight } from '../types'

const departureFormat = new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' })

interface FlightCardProps {
  flight: Flight
  selected: boolean
  onSelect: () => void
}

export function FlightCard({ flight, selected, onSelect }: FlightCardProps) {
  const lowThreshold = Math.max(1, Math.ceil(flight.capacity * 0.2))
  const level = flight.isFull ? 'full' : flight.availableSeats <= lowThreshold ? 'low' : 'ok'
  const label = flight.isFull
    ? 'Lleno'
    : level === 'low'
      ? flight.availableSeats === 1
        ? 'Último asiento'
        : `Últimos ${flight.availableSeats} asientos`
      : `${flight.availableSeats} disponibles`
  const percent = Math.round((flight.registeredPassengers / flight.capacity) * 100)

  return (
    <button type="button" className="card" aria-pressed={selected} onClick={onSelect}>
      <span className="card-header">
        <strong className="flight-number">{flight.flightNumber}</strong>
        <span className={`badge badge-${level}`}>{label}</span>
      </span>
      <span className="route">
        {flight.origin} → {flight.destination}
      </span>
      <span className="muted">{departureFormat.format(new Date(flight.departsAt))}</span>
      <span className="meter" aria-hidden="true">
        <span className={`meter-fill meter-${level}`} style={{ width: `${percent}%` }} />
      </span>
      <span className="muted">
        {flight.registeredPassengers} de {flight.capacity} asientos ocupados
      </span>
    </button>
  )
}
