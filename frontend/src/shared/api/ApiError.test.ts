import { describe, expect, it } from 'vitest'
import { ApiError, getErrorMessage } from './ApiError'

describe('ApiError', () => {
  it('extracts stable codes and field errors from ProblemDetails', () => {
    const error = ApiError.fromProblem(400, {
      status: 400,
      code: 'Request.Invalid',
      detail: 'Invalid input.',
      errors: { fullName: ['Required.'] },
    })

    expect(error.code).toBe('Request.Invalid')
    expect(error.fieldErrors).toEqual({ fullName: ['Required.'] })
    expect(getErrorMessage(error)).toBe('Revisa los datos ingresados.')
  })

  it.each([
    [502, 'Network.Unavailable', /no pudimos conectar/i],
    [504, 'Network.Timeout', /tardó demasiado/i],
    [500, 'Http.Status500', /error en el servidor/i],
  ])('classifies a %i without ProblemDetails by its status', (status, code, message) => {
    const error = ApiError.fromProblem(status, null)

    expect(error.code).toBe(code)
    expect(error.isTransient).toBe(true)
    expect(getErrorMessage(error)).toMatch(message)
  })
})
