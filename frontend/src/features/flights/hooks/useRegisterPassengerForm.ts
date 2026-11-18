import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError, getErrorMessage } from '../../../shared/api/ApiError'
import { useRegisterPassenger } from './useFlights'
import type { Flight, RegisterPassengerInput } from '../types'
import { registerPassengerSchema } from '../schemas/registerPassengerSchema'

const serverFieldMessages: Record<keyof RegisterPassengerInput, string> = {
  fullName: 'Revisa el nombre completo.',
  documentNumber: 'Revisa el documento de identidad.',
}

const fieldErrorCodes = ['Request.Invalid', 'Passenger.AlreadyRegistered']

export function useRegisterPassengerForm(flight: Flight) {
  const [success, setSuccess] = useState<string | null>(null)
  const registration = useRegisterPassenger(flight.id)
  const form = useForm<RegisterPassengerInput>({
    resolver: zodResolver(registerPassengerSchema),
    defaultValues: { fullName: '', documentNumber: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setSuccess(null)
    try {
      const passenger = await registration.mutateAsync(values)
      form.reset()
      setSuccess(`Se registró a ${passenger.fullName} en el vuelo ${flight.flightNumber}.`)
    } catch (error) {
      if (!(error instanceof ApiError)) return
      if (error.code === 'Passenger.AlreadyRegistered') {
        form.setError('documentNumber', { message: getErrorMessage(error) })
        return
      }
      for (const field of Object.keys(error.fieldErrors)) {
        if (field === 'fullName' || field === 'documentNumber') {
          form.setError(field, { message: serverFieldMessages[field] })
        }
      }
    }
  })

  const showErrorAlert =
    registration.isError &&
    !(registration.error instanceof ApiError && fieldErrorCodes.includes(registration.error.code))

  return { form, onSubmit, success, registration, showErrorAlert }
}
