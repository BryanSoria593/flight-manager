import { describe, expect, it, vi } from 'vitest'
import { request } from './httpClient'
import { flightSchema } from '../../features/flights/types'

describe('request', () => {
  it('turns a successful non-JSON response into Response.Invalid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>gateway error</html>', { status: 200 }))

    await expect(request('/api/v1/flights', { schema: flightSchema })).rejects.toMatchObject({
      code: 'Response.Invalid',
      status: 200,
    })
  })

  it('classifies a failed non-JSON response (proxy with the API down) as Network.Unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 502, statusText: 'Bad Gateway' }))

    await expect(request('/api/v1/flights', { schema: flightSchema })).rejects.toMatchObject({
      code: 'Network.Unavailable',
      status: 502,
    })
  })

  it('turns a response that violates its schema into Response.Invalid', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, flightNumber: 'FB-1' }]), { status: 200 }),
    )

    await expect(request('/api/v1/flights', { schema: flightSchema.array() })).rejects.toMatchObject({
      code: 'Response.Invalid',
      status: 200,
    })
  })

  it('maps a timeout while reading the response body to Network.Timeout', async () => {
    const timeout = new AbortController()
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal)
    const response = new Response('{}', { status: 200 })
    vi.spyOn(response, 'json').mockImplementation(async () => {
      timeout.abort()
      throw new DOMException('Aborted', 'AbortError')
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response)

    await expect(request('/api/v1/flights', { schema: flightSchema })).rejects.toMatchObject({
      code: 'Network.Timeout',
      status: 0,
    })
  })
})
