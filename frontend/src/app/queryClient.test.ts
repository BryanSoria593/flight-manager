import { describe, expect, it } from 'vitest'
import { ApiError } from '../shared/api/ApiError'
import { createQueryClient } from './queryClient'

describe('query retry policy', () => {
  it('retries transient errors twice and does not retry client errors', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry
    expect(typeof retry).toBe('function')
    if (typeof retry !== 'function') throw new Error('Expected a retry function.')

    expect(retry(0, new ApiError({ status: 0, code: 'Network.Unavailable', message: '' }))).toBe(true)
    expect(retry(1, new ApiError({ status: 503, code: 'Server.Unexpected', message: '' }))).toBe(true)
    expect(retry(2, new ApiError({ status: 503, code: 'Server.Unexpected', message: '' }))).toBe(false)
    expect(retry(0, new ApiError({ status: 409, code: 'Flight.Full', message: '' }))).toBe(false)
  })
})
