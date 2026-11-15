import { createServerFn } from '@tanstack/react-start'

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8794'

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type ProxyInput = { path: string; method?: Method; body?: unknown }
export type ProxyResult<T = any> = { status: number; json: T }

/**
 * Every call to Fastify goes through here.
 * Forwards the browser cookie to the API and relays Set-Cookie back, so the
 * signed session and admin cookies live on the web origin and the API stays stateless.
 */
export const apiCall = createServerFn({ method: 'POST' })
  .validator((input: ProxyInput) => input)
  .handler(async ({ data }): Promise<ProxyResult> => {
    const { appendResponseHeader, getRequestHeaders } = await import('@tanstack/react-start/server')
    const headers = new Headers({ accept: 'application/json' })
    if (data.body !== undefined) headers.set('content-type', 'application/json')
    const cookie = getRequestHeaders().get('cookie')
    if (cookie) headers.set('cookie', cookie)

    const res = await fetch(`${API_URL}${data.path}`, {
      method: data.method ?? 'GET',
      headers,
      body: data.body === undefined ? undefined : JSON.stringify(data.body),
    })

    for (const value of res.headers.getSetCookie()) {
      appendResponseHeader('set-cookie', value)
    }

    const text = await res.text()
    let json: unknown = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { ok: false, error: 'bad_api_response', raw: text.slice(0, 200) }
    }
    return { status: res.status, json }
  })

async function get<T>(path: string): Promise<T> {
  const { json } = await apiCall({ data: { path } })
  return json as T
}

async function send<T>(path: string, method: Method, body?: unknown): Promise<T> {
  const { json } = await apiCall({ data: { path, method, body } })
  return json as T
}

export const api = {
  raw: (path: string, method: Method = 'GET', body?: unknown) => apiCall({ data: { path, method, body } }),
  assign: (section: 'male' | 'female') => get<{ ok: boolean; routeId: number | null }>(`/routes/${section}/assign`),
  routePublic: (id: number) =>
    get<{ ok: boolean; route?: RoutePublic; stops?: number; drawCount?: number; error?: string }>(
      `/routes/${id}/public`,
    ),
  startSession: (input: { routeId: number; mode: 'solo' | 'team'; name: string }) =>
    send<{ ok: boolean; code?: string; joinCode?: string; error?: string }>('/sessions', 'POST', input),
  me: () => get<{ ok: boolean; state: SessionState | null; finish: Finish | null }>('/sessions/me'),
  scan: (code: string) => get<{ ok: boolean; result: ScanResult }>(`/scan/${encodeURIComponent(code)}`),
  scanPost: (code: string) => send<{ ok: boolean; result: ScanResult }>('/scan', 'POST', { code }),
  join: (code: string) => send<{ ok: boolean; code?: string; error?: string }>('/join', 'POST', { code }),
  board: () =>
    get<{ ok: boolean; boards: { route: RoutePublic; rows: BoardRow[] }[] }>('/board'),

  adminLogin: (password: string) => send<{ ok: boolean; error?: string }>('/admin/login', 'POST', { password }),
  adminLogout: () => send<{ ok: boolean }>('/admin/logout', 'POST', {}),
  adminRoutes: () =>
    get<{ ok: boolean; routes: AdminRouteRow[]; hasBaseUrl: boolean }>('/admin/routes'),
  adminCreateRoute: (input: { nameAr: string; nameEn: string; section: 'male' | 'female'; drawCount?: number }) =>
    send<{ ok: boolean; route?: { id: number }; error?: string }>('/admin/routes', 'POST', input),
  adminRoute: (id: number) =>
    get<{ ok: boolean; route?: RouteFull; posters?: Poster[]; error?: string }>(`/admin/routes/${id}`),
  adminUpdateRoute: (
    id: number,
    input: { nameAr?: string; nameEn?: string; section?: 'male' | 'female'; drawCount?: number },
  ) => send<{ ok: boolean }>(`/admin/routes/${id}`, 'PATCH', input),
  adminStatus: (id: number, status: 'draft' | 'open' | 'closed') =>
    send<{ ok: boolean }>(`/admin/routes/${id}/status`, 'POST', { status }),
  adminAddPoster: (
    routeId: number,
    input: { nameAr: string; nameEn?: string; riddleAr: string; riddleEn?: string; active?: boolean; lat?: string; lng?: string },
  ) => send<{ ok: boolean; error?: string }>(`/admin/routes/${routeId}/posters`, 'POST', input),
  adminUpdatePoster: (id: number, input: Record<string, unknown>) =>
    send<{ ok: boolean }>(`/admin/posters/${id}`, 'PATCH', input),
  adminDeletePoster: (id: number) => send<{ ok: boolean }>(`/admin/posters/${id}`, 'DELETE'),
  adminRegenerateToken: (id: number) => send<{ ok: boolean }>(`/admin/posters/${id}/token`, 'POST', {}),
  adminMovePoster: (id: number, dir: -1 | 1) =>
    send<{ ok: boolean; moved?: boolean }>(`/admin/posters/${id}/move`, 'POST', { dir }),
  adminSessions: (routeId: number) =>
    get<{ ok: boolean; route?: { id: number; nameAr: string }; sessions?: AdminSessionRow[] }>(
      `/admin/routes/${routeId}/sessions`,
    ),
  adminSessionAction: (id: number, action: 'advance' | 'reset' | 'test' | 'redeem' | 'unredeem') =>
    send<{ ok: boolean; error?: string; redeemedAt?: string }>(`/admin/sessions/${id}/${action}`, 'POST', {}),
  verify: (code: string) => get<ClaimCheck>(`/verify/${encodeURIComponent(code)}`),
  adminSettings: () => get<{ ok: boolean; baseUrl: string }>('/admin/settings'),
  adminSaveSettings: (baseUrl: string) => send<{ ok: boolean; baseUrl: string }>('/admin/settings', 'PUT', { baseUrl }),
}

/* --------------------------------------------------------------- types */

export type RoutePublic = { id: number; nameAr: string; nameEn: string; section: 'male' | 'female'; drawCount?: number }
export type RouteFull = RoutePublic & { status: 'draft' | 'open' | 'closed'; drawCount: number; createdAt: string }
export type Poster = {
  id: number
  routeId: number
  nameAr: string
  nameEn: string
  riddleAr: string
  riddleEn: string
  token: string
  humanCode: string
  seq: number
  active: boolean
  lat: number | null
  lng: number | null
}
export type SessionState = {
  code: string
  name: string
  mode: 'solo' | 'team'
  section: 'male' | 'female'
  joinCode: string
  claimCode: string | null
  redeemedAt: string | null
  status: 'active' | 'finished'
  startedAt: string
  finishedAt: string | null
  durationMs: number | null
  route: RoutePublic & { status: string }
  total: number
  done: number
  current: { stepNo: number; nameAr: string; nameEn: string; riddleAr: string; riddleEn: string; humanCode: string } | null
}
export type BoardRow = { rank: number; name: string; mode: 'solo' | 'team'; durationMs: number }
export type Finish = {
  route: RoutePublic | null
  rank: number | null
  claimCode: string | null
  claimUrl: string | null
  redeemedAt: string | null
  board: BoardRow[]
}
export type ScanResult =
  | { kind: 'advance'; posterName: { ar: string; en: string }; next: { ar: string; en: string } | null; finished: boolean }
  | { kind: 'finished'; posterName: { ar: string; en: string } | null }
  | { kind: 'repeat'; next: { ar: string; en: string } | null }
  | { kind: 'not_yet' }
  | { kind: 'other_route' }
  | { kind: 'invalid' }
  | { kind: 'no_session' }
export type AdminRouteRow = {
  id: number
  nameAr: string
  nameEn: string
  section: 'male' | 'female'
  status: 'draft' | 'open' | 'closed'
  drawCount: number
  posters: number
  running: number
  finished: number
}
export type AdminSessionRow = {
  id: number
  name: string
  mode: 'solo' | 'team'
  joinCode: string
  isTest: boolean
  status: 'active' | 'finished'
  elapsedMs: number | null
  durationMs: number | null
  total: number
  step: number
  finishedSteps: number
  claimCode: string | null
  redeemedAt: string | null
  devices: number
}

export type ClaimCheck = {
  ok: boolean
  valid: boolean
  used: boolean
  sessionId?: number
  redeemedAt?: string | null
  isTest?: boolean
  name?: string
  mode?: 'solo' | 'team'
  section?: 'male' | 'female'
  route?: string
  durationMs?: number | null
  rank?: number
  finishedAt?: string | null
  claimCode?: string
}
