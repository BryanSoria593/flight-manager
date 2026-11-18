import { Alert } from '../../../shared/components/Alert'
import { getErrorMessage } from '../../../shared/api/ApiError'
import { useFlightPassengers } from '../hooks/useFlights'

export function PassengerList({ flightId }: { flightId: number }) {
  const passengers = useFlightPassengers(flightId)

  if (passengers.isPending) return <p role="status" className="muted">Cargando pasajeros…</p>

  if (passengers.isLoadingError) {
    return (
      <Alert variant="error">
        <p>{getErrorMessage(passengers.error)}</p>
        <button type="button" className="btn" onClick={() => passengers.refetch()}>
          Reintentar
        </button>
      </Alert>
    )
  }

  if (passengers.data.length === 0) return <p className="muted">Aún no hay pasajeros registrados.</p>

  return (
    <ul className="passenger-list">
      {passengers.data.map((passenger) => (
        <li key={passenger.id}>
          {passenger.fullName} · <span className="passenger-document">{passenger.documentNumber}</span>
        </li>
      ))}
    </ul>
  )
}
