export interface ProblemDetails {
  title?: string
  status?: number
  detail?: string
  code?: string
  traceId?: string
  errors?: Record<string, string[]>
}

const gatewayCodes: Partial<Record<number, string>> = { 502: 'Network.Unavailable', 504: 'Network.Timeout' }

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: Record<string, string[]>

  constructor(init: { status: number; code: string; message: string; fieldErrors?: Record<string, string[]> }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.fieldErrors = init.fieldErrors ?? {}
  }

  get isTransient(): boolean {
    return this.status === 0 || this.status >= 500
  }

  static fromProblem(status: number, problem: ProblemDetails | null): ApiError {
    const fieldErrors = problem?.errors ?? {}
    return new ApiError({
      status,
      code:
        problem?.code ??
        (Object.keys(fieldErrors).length > 0
          ? 'Request.Invalid'
          : (gatewayCodes[status] ?? `Http.Status${status}`)),
      message: problem?.detail ?? problem?.title ?? `HTTP ${status}`,
      fieldErrors,
    })
  }

  static invalidResponse(status = 0): ApiError {
    return new ApiError({ status, code: 'Response.Invalid', message: 'The server returned an invalid response.' })
  }
}

const messages: Partial<Record<string, string>> = {
  'Flight.Full': 'El vuelo ya está lleno. No es posible registrar más pasajeros.',
  'Passenger.AlreadyRegistered': 'Este documento ya está registrado en el vuelo.',
  'Flight.NotFound': 'El vuelo ya no existe. Actualiza la lista.',
  'Request.Invalid': 'Revisa los datos ingresados.',
  'Request.Malformed': 'El servidor recibió una solicitud malformada. Intenta nuevamente.',
  'Response.Invalid': 'El servidor devolvió una respuesta no válida. Intenta nuevamente.',
  'Server.SimulatedFailure': 'El servidor no está disponible (fallo simulado). Intenta nuevamente.',
  'Network.Unavailable': 'No pudimos conectar con el servidor. Verifica que la API esté en ejecución.',
  'Network.Timeout': 'El servidor tardó demasiado en responder. Intenta nuevamente.',
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado.'
  return (
    messages[error.code] ??
    (error.status >= 500 ? 'Ocurrió un error en el servidor. Intenta en unos segundos.' : 'Ocurrió un error inesperado.')
  )
}

