import { ApiError } from './ApiError'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const TIMEOUT_MS = 10_000

let simulateFailure = false

export function setSimulateFailure(enabled: boolean) {
  simulateFailure = enabled
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const headers = new Headers({ Accept: 'application/json' })
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (simulateFailure) headers.set('X-Simulate-Failure', 'true')

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError({
      status: 0,
      code: timeout.aborted ? 'Network.Timeout' : 'Network.Unavailable',
      message: 'No response from the server.',
    })
  }

  if (!response.ok) throw await ApiError.fromResponse(response)
  return (await response.json()) as T
}
