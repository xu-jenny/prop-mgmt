import { hc } from 'hono/client'
import { queryOptions } from '@tanstack/react-query'
import type { AppType } from '@prop-mgmt/api'

// Typed client for the Hono API: api.api.walkthrough.$get() knows the response shape.
export const api = hc<AppType>('/')

export const healthQuery = queryOptions({
  queryKey: ['health'],
  queryFn: async () => {
    const res = await api.api.health.$get()
    if (!res.ok) throw new Error(`API returned ${res.status}`)
    return res.json()
  },
})

export const walkthroughQuery = queryOptions({
  queryKey: ['walkthrough'],
  queryFn: async () => {
    const res = await api.api.walkthrough.$get()
    if (!res.ok) throw new Error(`API returned ${res.status}`)
    return res.json()
  },
})
