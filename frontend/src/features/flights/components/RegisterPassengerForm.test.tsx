import { useRef } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithQueryClient } from '../../../test/utils'
import type { Flight } from '../types'
import { RegisterPassengerForm } from './RegisterPassengerForm'

const flight: Flight = {
  id: 2,
  flightNumber: 'FB-202',
  origin: 'Guayaquil',
  destination: 'Galápagos (Baltra)',
  departsAt: '2026-11-18T09:30:00-05:00',
  capacity: 3,
  registeredPassengers: 2,
  availableSeats: 1,
  isFull: false,
}

const createdPassenger = {
  id: '01a1f1c7-71a4-74af-a7f2-a50ce4587049',
  flightId: 2,
  fullName: 'Ana Morales',
  documentNumber: '1712345678',
  registeredAt: '2026-11-19T03:08:59.2421069+00:00',
}

describe('RegisterPassengerForm', () => {
  it('sends a single registration when the submit button is clicked several times at once', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (_input, init) =>
        init?.method === 'POST' ? jsonResponse(201, createdPassenger) : jsonResponse(200, []),
      )
    const user = userEvent.setup()
    renderWithQueryClient(<RegisterPassengerForm flight={flight} />)
    await user.type(screen.getByLabelText(/nombre completo/i), 'Ana Morales')
    await user.type(screen.getByLabelText(/documento/i), '1712345678')

    const submit = screen.getByRole('button', { name: /registrar pasajero/i })
    fireEvent.click(submit)
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(await screen.findByText(/se registró a ana morales/i)).toBeInTheDocument()
    const posts = fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')
    expect(posts).toHaveLength(1)
  })

  it('shows a single alert once the flight that filled up is refreshed as full', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse(409, { status: 409, code: 'Flight.Full', detail: 'Flight FB-202 is full.' }),
    )
    const user = userEvent.setup()
    const { rerender } = renderWithQueryClient(<RegisterPassengerForm flight={flight} />)
    await user.type(screen.getByLabelText(/nombre completo/i), 'Ana Morales')
    await user.type(screen.getByLabelText(/documento/i), '1712345678')
    await user.click(screen.getByRole('button', { name: /registrar pasajero/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/lleno/i)

    rerender(<RegisterPassengerForm flight={{ ...flight, registeredPassengers: 3, availableSeats: 0, isFull: true }} />)

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1))
    expect(screen.getByRole('alert')).toHaveTextContent(/vuelo lleno/i)
  })

  it('shows a clear message when the API answers Flight.Full', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(409, { status: 409, code: 'Flight.Full', detail: 'Flight FB-202 has reached its maximum capacity of 3 passengers.' }),
    )
    const user = userEvent.setup()
    renderWithQueryClient(<RegisterPassengerForm flight={flight} />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Ana Morales')
    await user.type(screen.getByLabelText(/documento/i), '1712345678')
    await user.click(screen.getByRole('button', { name: /registrar pasajero/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/lleno/i)
  })

  it('disables registration and explains why when the flight is full', () => {
    renderWithQueryClient(
      <RegisterPassengerForm flight={{ ...flight, registeredPassengers: 3, availableSeats: 0, isFull: true }} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/vuelo lleno/i)
    expect(screen.getByRole('button', { name: /registrar pasajero/i })).toBeDisabled()
  })

  it('accepts a name with decomposed accents and sends it composed (NFC)', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (_input, init) =>
        init?.method === 'POST' ? jsonResponse(201, { ...createdPassenger, fullName: 'José Pérez' }) : jsonResponse(200, []),
      )
    const user = userEvent.setup()
    renderWithQueryClient(<RegisterPassengerForm flight={flight} />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'José Pérez')
    await user.type(screen.getByLabelText(/documento/i), '1712345678')
    await user.click(screen.getByRole('button', { name: /registrar pasajero/i }))

    expect(await screen.findByText(/se registró a josé pérez/i)).toBeInTheDocument()
    const [, init] = fetchMock.mock.calls.find(([, call]) => call?.method === 'POST')!
    expect(JSON.parse(String(init?.body)).fullName).toBe('José Pérez')
  })

  it('shows a duplicate-document error next to the document field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(409, { status: 409, code: 'Passenger.AlreadyRegistered', detail: 'Already registered.' }),
    )
    const user = userEvent.setup()
    renderWithQueryClient(<RegisterPassengerForm flight={flight} />)

    await user.type(screen.getByLabelText(/nombre completo/i), 'Ana Morales')
    await user.type(screen.getByLabelText(/documento/i), '1712345678')
    await user.click(screen.getByRole('button', { name: /registrar pasajero/i }))

    expect(await screen.findByText(/este documento ya está registrado/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/documento/i)).toHaveAttribute('aria-invalid', 'true')
  })
})

function FormWithFallback({ flight: target }: { flight: Flight }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  return (
    <>
      <h2 ref={headingRef} tabIndex={-1}>
        Detalle {target.flightNumber}
      </h2>
      <RegisterPassengerForm flight={target} focusFallbackRef={headingRef} />
    </>
  )
}

const roomyFlight: Flight = { ...flight, registeredPassengers: 0, availableSeats: 3 }

async function fillAndSubmit(document: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/nombre completo/i), 'Ana Morales')
  await user.type(screen.getByLabelText(/documento/i), document)
  await user.keyboard('{Enter}')
}

describe('RegisterPassengerForm keyboard focus after submitting', () => {
  it('returns focus to the name field after a successful registration, ready for the next passenger', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) =>
      init?.method === 'POST' ? jsonResponse(201, createdPassenger) : jsonResponse(200, []),
    )
    renderWithQueryClient(<FormWithFallback flight={roomyFlight} />)

    await fillAndSubmit('1712345678')

    await screen.findByText(/se registró a ana morales/i)
    await waitFor(() => expect(screen.getByLabelText(/nombre completo/i)).toHaveFocus())
  })

  it('moves focus to the flight heading when the registration took the last seat', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) =>
      init?.method === 'POST' ? jsonResponse(201, createdPassenger) : jsonResponse(200, []),
    )
    renderWithQueryClient(<FormWithFallback flight={flight} />)

    await fillAndSubmit('1712345678')

    await screen.findByText(/se registró a ana morales/i)
    await waitFor(() => expect(screen.getByRole('heading', { name: /detalle fb-202/i })).toHaveFocus())
  })

  it('moves focus to the document field when the document is already registered', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) =>
      init?.method === 'POST'
        ? jsonResponse(409, { status: 409, code: 'Passenger.AlreadyRegistered', detail: 'Already registered.' })
        : jsonResponse(200, []),
    )
    renderWithQueryClient(<FormWithFallback flight={roomyFlight} />)

    await fillAndSubmit('1712345678')

    await screen.findByText(/este documento ya está registrado/i)
    await waitFor(() => expect(screen.getByLabelText(/documento/i)).toHaveFocus())
  })

  it.each([
    [409, 'Flight.Full'],
    [503, 'Server.SimulatedFailure'],
  ])('moves focus to the flight heading when the server answers %i %s', async (status, code) => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) =>
      init?.method === 'POST' ? jsonResponse(status, { status, code }) : jsonResponse(200, []),
    )
    renderWithQueryClient(<FormWithFallback flight={roomyFlight} />)

    await fillAndSubmit('1712345678')

    await screen.findByRole('alert')
    await waitFor(() => expect(screen.getByRole('heading', { name: /detalle fb-202/i })).toHaveFocus())
  })
})

describe('RegisterPassengerForm keyboard focus while the request is in flight', () => {
  it('parks focus on the flight heading before the form is disabled, then returns it to the name field', async () => {
    let respond: (response: Response) => void = () => {}
    vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) =>
      init?.method === 'POST'
        ? new Promise<Response>((resolve) => {
            respond = resolve
          })
        : Promise.resolve(jsonResponse(200, [])),
    )
    renderWithQueryClient(<FormWithFallback flight={roomyFlight} />)

    await fillAndSubmit('1712345678')

    expect(await screen.findByRole('button', { name: /registrando/i })).toBeDisabled()
    expect(screen.getByRole('heading', { name: /detalle fb-202/i })).toHaveFocus()

    respond(jsonResponse(201, createdPassenger))

    await screen.findByText(/se registró a ana morales/i)
    await waitFor(() => expect(screen.getByLabelText(/nombre completo/i)).toHaveFocus())
  })
})
