import { Alert } from './Alert'

export function StaleDataWarning({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="warning">
      <p>No se pudo actualizar; se muestra la última información disponible.</p>
      <button type="button" className="btn" onClick={onRetry}>
        Reintentar
      </button>
    </Alert>
  )
}
