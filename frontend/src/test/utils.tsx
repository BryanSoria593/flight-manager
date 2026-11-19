import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'

export function renderWithQueryClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrap = (element: ReactElement) => <QueryClientProvider client={client}>{element}</QueryClientProvider>
  const view = render(wrap(ui))
  return { ...view, client, rerender: (next: ReactElement) => view.rerender(wrap(next)) }
}

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
