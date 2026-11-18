import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../shared/api/ApiError'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        retry: (failureCount, error) => error instanceof ApiError && error.isTransient && failureCount < 2,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
      },
      mutations: { retry: false },
    },
  })
}
