import { ApiError, type ProblemDetails } from './ApiError'
import type { z } from 'zod'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TIMEOUT_MS = 10_000

let simulateFailure = false

export function setSimulateFailure(enabled: boolean) {
  simulateFailure = enabled
}

interface RequestOptions<T> {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
  schema: z.ZodType<T>
}

export async function request<T>(path: string, { method = 'GET', body, signal, schema }: RequestOptions<T>): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (import.meta.env.DEV && simulateFailure) headers.set('X-Simulate-Failure', 'true')

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: requestSignal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError({
      status: 0,
      code: timeout.aborted ? 'Network.Timeout' : 'Network.Unavailable',
      message: 'No response from the server.',
    })
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeout.aborted) {
      throw new ApiError({ status: 0, code: 'Network.Timeout', message: 'The server response timed out.' })
    }
    if (!response.ok) throw ApiError.fromProblem(response.status, null)
    throw ApiError.invalidResponse(response.status)
  }

  if (!response.ok) throw ApiError.fromProblem(response.status, payload as ProblemDetails | null)

  const parsed = schema.safeParse(payload)
  if (!parsed.success) throw ApiError.invalidResponse(response.status)
  return parsed.data
}
