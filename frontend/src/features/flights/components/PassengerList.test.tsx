import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithQueryClient } from '../../../test/utils'
import { PassengerList } from './PassengerList'

const passenger = {
  id: '01a1f1c7-71a4-74af-a7f2-a50ce4587049',
  flightId: 2,
  fullName: 'Carlos Vega',
  documentNumber: '0912345678',
  registeredAt: '2026-11-19T03:08:59.2421069+00:00',
}

describe('PassengerList', () => {
  it('keeps the last passengers and warns when a refresh fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(200, [passenger]))
      .mockResolvedValueOnce(jsonResponse(503, { status: 503, code: 'Server.SimulatedFailure' }))
    const { client } = renderWithQueryClient(<PassengerList flightId={2} />)
    expect(await screen.findByText(/carlos vega/i)).toBeInTheDocument()

    await act(() => client.refetchQueries())

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo actualizar/i)
    expect(screen.getByText(/carlos vega/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })
})
