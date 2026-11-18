import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ColorSchemeSwitcher } from './ColorSchemeSwitcher'
import { FlightsPage } from '../features/flights'
import { setSimulateFailure } from '../shared/api/httpClient'

export function App() {
  const queryClient = useQueryClient()
  const [failureEnabled, setFailureEnabled] = useState(false)

  function toggleFailure(enabled: boolean) {
    setFailureEnabled(enabled)
    setSimulateFailure(enabled)
    void queryClient.invalidateQueries()
  }

  return (
    <>
      <header className="app-header">
        <h1>Registro de pasajeros</h1>
        <ColorSchemeSwitcher />
        {import.meta.env.DEV && (
          <label className="dev-toggle">
            <input type="checkbox" checked={failureEnabled} onChange={(event) => toggleFailure(event.target.checked)} />
            Simular fallo de la API
          </label>
        )}
      </header>
      <main>
        <FlightsPage />
      </main>
    </>
  )
}
