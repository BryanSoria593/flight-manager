import type { RefObject } from 'react'
import { Alert } from '../../../shared/components/Alert'
import { getErrorMessage } from '../../../shared/api/ApiError'
import { useRegisterPassengerForm } from '../hooks/useRegisterPassengerForm'
import type { Flight } from '../types'

interface RegisterPassengerFormProps {
  flight: Flight
  focusFallbackRef?: RefObject<HTMLElement | null>
}

export function RegisterPassengerForm({ flight, focusFallbackRef }: RegisterPassengerFormProps) {
  const { form, onSubmit, success, registration, showErrorAlert } = useRegisterPassengerForm(flight, focusFallbackRef)
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} noValidate className="form">
      {flight.isFull && (
        <Alert variant="warning" title="Vuelo lleno">
          Este vuelo alcanzó su capacidad máxima ({flight.capacity} pasajeros). No se pueden registrar más.
        </Alert>
      )}

      <fieldset disabled={flight.isFull || registration.isPending}>
        <legend>Registrar pasajero</legend>

        <label htmlFor="fullName">Nombre completo</label>
        <input
          id="fullName"
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p id="fullName-error" className="field-error">
            {errors.fullName.message}
          </p>
        )}

        <label htmlFor="documentNumber">Documento de identidad</label>
        <input
          id="documentNumber"
          aria-invalid={Boolean(errors.documentNumber)}
          aria-describedby={errors.documentNumber ? 'documentNumber-error' : undefined}
          {...register('documentNumber')}
        />
        {errors.documentNumber && (
          <p id="documentNumber-error" className="field-error">
            {errors.documentNumber.message}
          </p>
        )}

        <button type="submit" className="btn btn-primary">
          {registration.isPending ? 'Registrando…' : 'Registrar pasajero'}
        </button>
      </fieldset>

      {showErrorAlert && <Alert variant="error">{getErrorMessage(registration.error)}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
    </form>
  )
}
