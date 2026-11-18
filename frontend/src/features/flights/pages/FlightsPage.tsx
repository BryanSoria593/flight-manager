import { useState } from 'react'
import { Alert } from '../../../shared/components/Alert'
import { getErrorMessage } from '../../../shared/api/ApiError'
import { useFlights } from '../hooks/useFlights'
import { FlightCard } from '../components/FlightCard'
import { FlightDetail } from '../components/FlightDetail'

export function FlightsPage() {
  const flights = useFlights()
  const [selectedFlightId, setSelectedFlightId] = useState<number | null>(null)

  if (flights.isPending) {
    return (
      <div className="skeleton" aria-busy="true">
        <span className="visually-hidden">Cargando vuelos…</span>
      </div>
    )
  }

  if (flights.isLoadingError) {
    return (
      <Alert variant="error" title="No pudimos cargar los vuelos">
        <p>{getErrorMessage(flights.error)}</p>
        <button type="button" className="btn" onClick={() => flights.refetch()}>
          Reintentar
        </button>
      </Alert>
    )
  }

  const selectedFlight = flights.data.find((flight) => flight.id === selectedFlightId) ?? null

  return (
    <div className="layout">
      <section aria-labelledby="flights-title">
        <h2 id="flights-title">Vuelos</h2>
        {flights.isFetching && <p role="status" className="muted">Actualizando…</p>}
        {flights.isRefetchError && (
          <Alert variant="warning">
            <p>No se pudo actualizar; se muestra la última información disponible.</p>
            <button type="button" className="btn" onClick={() => flights.refetch()}>
              Reintentar
            </button>
          </Alert>
        )}
        {flights.data.length === 0 ? (
          <p className="muted">No hay vuelos disponibles.</p>
        ) : (
          <ul className="flight-list">
            {flights.data.map((flight) => (
              <li key={flight.id}>
                <FlightCard
                  flight={flight}
                  selected={flight.id === selectedFlightId}
                  onSelect={() => setSelectedFlightId(flight.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-label="Detalle del vuelo">
        {selectedFlight ? (
          <FlightDetail key={selectedFlight.id} flight={selectedFlight} />
        ) : (
          <p className="muted">Selecciona un vuelo para ver su ocupación y registrar pasajeros.</p>
        )}
      </section>
    </div>
  )
}
