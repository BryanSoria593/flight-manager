import { zodResolver } from '@hookform/resolvers/zod'
import { type BaseSyntheticEvent, type RefObject, useEffect, useRef, useState } from 'react'
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
const formFields = ['fullName', 'documentNumber'] as const

type FocusTarget = (typeof formFields)[number] | 'fallback'

export function useRegisterPassengerForm(flight: Flight, focusFallbackRef?: RefObject<HTMLElement | null>) {
  const [success, setSuccess] = useState<string | null>(null)
  const [focusAfterSubmit, setFocusAfterSubmit] = useState<FocusTarget | null>(null)
  const submitting = useRef(false)
  const registration = useRegisterPassenger(flight.id)
  const form = useForm<RegisterPassengerInput>({
    resolver: zodResolver(registerPassengerSchema),
    defaultValues: { fullName: '', documentNumber: '' },
  })

  useEffect(() => {
    if (!focusAfterSubmit || registration.isPending) return
    if (focusAfterSubmit === 'fallback') focusFallbackRef?.current?.focus()
    else form.setFocus(focusAfterSubmit)
  }, [focusAfterSubmit, registration.isPending, form, focusFallbackRef])

  const register = async (values: RegisterPassengerInput) => {
    if (submitting.current) return
    submitting.current = true
    focusFallbackRef?.current?.focus({ preventScroll: true })
    setSuccess(null)
    setFocusAfterSubmit(null)
    try {
      const passenger = await registration.mutateAsync(values)
      form.reset()
      setSuccess(`Se registró a ${passenger.fullName} en el vuelo ${flight.flightNumber}.`)
      setFocusAfterSubmit(flight.availableSeats <= 1 ? 'fallback' : 'fullName')
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFocusAfterSubmit('fallback')
        return
      }
      if (error.code === 'Passenger.AlreadyRegistered') {
        form.setError('documentNumber', { message: getErrorMessage(error) })
        setFocusAfterSubmit('documentNumber')
        return
      }
      const invalidFields = formFields.filter((field) => field in error.fieldErrors)
      for (const field of invalidFields) {
        form.setError(field, { message: serverFieldMessages[field] })
      }
      setFocusAfterSubmit(invalidFields[0] ?? 'fallback')
    } finally {
      submitting.current = false
    }
  }

  const onSubmit = (event?: BaseSyntheticEvent) => form.handleSubmit(register)(event)

  const errorCode = registration.error instanceof ApiError ? registration.error.code : null
  const shownNextToField = errorCode !== null && fieldErrorCodes.includes(errorCode)
  const shownAsFullWarning = errorCode === 'Flight.Full' && flight.isFull
  const showErrorAlert = registration.isError && !shownNextToField && !shownAsFullWarning

  return { form, onSubmit, success, registration, showErrorAlert }
}
