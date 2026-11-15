import { prisma, randomCode, randomToken } from '@club/db'
import type { HuntSession, Poster, Route, Section, SessionMode } from '@club/db'

export type PublicPoster = {
  stepNo: number
  nameAr: string
  nameEn: string
  riddleAr: string
  riddleEn: string
  humanCode: string
}

export type SessionState = {
  code: string
  name: string
  mode: SessionMode
  section: Section
  joinCode: string
  claimCode: string | null
  redeemedAt: string | null
  status: 'active' | 'finished'
  startedAt: string
  finishedAt: string | null
  durationMs: number | null
  route: { id: number; nameAr: string; nameEn: string; section: Section; status: string }
  total: number
  done: number
  current: PublicPoster | null
}

export type ScanResult =
  | { kind: 'advance'; posterName: { ar: string; en: string }; next: { ar: string; en: string } | null; finished: boolean }
  | { kind: 'finished'; posterName: { ar: string; en: string } | null }
  | { kind: 'repeat'; next: { ar: string; en: string } | null }
  | { kind: 'not_yet' }
  | { kind: 'other_route' }
  | { kind: 'invalid' }
  | { kind: 'no_session' }

export async function assignRoute(section: Section) {
  const open = await prisma.route.findMany({
    where: { section, status: 'open' },
    select: { id: true },
  })
  if (open.length === 0) return null
  return open[Math.floor(Math.random() * open.length)].id
}

export async function routePublic(id: number) {
  const route = await prisma.route.findFirst({ where: { id, status: 'open' } })
  if (!route) return null
  const stops = await prisma.poster.count({ where: { routeId: id, active: true } })
  return { route, stops, drawCount: Math.min(route.drawCount, stops) }
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export async function startSession(input: { routeId: number; mode: SessionMode; name: string; ua: string }) {
  const route = await prisma.route.findFirst({ where: { id: input.routeId, status: 'open' } })
  if (!route) throw Object.assign(new Error('route_not_open'), { statusCode: 404 })

  const pool = await prisma.poster.findMany({
    where: { routeId: route.id, active: true },
    orderBy: [{ seq: 'asc' }, { id: 'asc' }],
  })
  if (pool.length === 0) throw Object.assign(new Error('empty_route'), { statusCode: 409 })

  // Each team gets its own path: drawCount stops out of the pool, in random order.
  const n = Math.min(Math.max(1, route.drawCount), pool.length)
  const picked = shuffle(pool).slice(0, n)

  const code = randomToken()
  const joinCode = randomCode(5)
  const deviceToken = randomToken()
  const session = await prisma.huntSession.create({
    data: {
      code,
      routeId: route.id,
      section: route.section,
      mode: input.mode,
      name: input.name.slice(0, 40) || 'Team',
      joinCode,
      steps: {
        create: picked.map((p: Poster, i: number) => ({ stepNo: i + 1, posterId: p.id })),
      },
      devices: { create: { token: deviceToken, ua: input.ua.slice(0, 180) } },
    },
  })
  return { session, deviceToken }
}

/** One token per phone, so a dead phone never locks the team out and devices revoke independently. */
export async function createDevice(sessionId: number, ua: string) {
  return prisma.device.create({
    data: { sessionId, token: randomToken(), ua: ua.slice(0, 180) },
  })
}

export async function sessionByDeviceToken(token: string | null): Promise<HuntSession | null> {
  if (!token) return null
  const device = await prisma.device.findUnique({ where: { token }, include: { session: true } })
  if (!device || device.revokedAt) return null
  void prisma.device
    .update({ where: { id: device.id }, data: { lastSeenAt: new Date() } })
    .catch(() => undefined)
  return device.session
}

async function claimCode(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = randomCode(8)
    const clash = await prisma.huntSession.findUnique({ where: { claimCode: code } })
    if (!clash) return code
  }
  return randomToken()
}

/** Closing a session mints the winner claim code exactly once. */
export async function finishSession(sessionId: number, startedAt: Date) {
  const now = new Date()
  return prisma.huntSession.update({
    where: { id: sessionId },
    data: {
      status: 'finished',
      finishedAt: now,
      durationMs: now.getTime() - startedAt.getTime(),
      claimCode: await claimCode(),
    },
  })
}

export async function claimInfo(rawCode: string) {
  const code = rawCode.trim().toUpperCase()
  if (!code) return null
  const session = await prisma.huntSession.findUnique({
    where: { claimCode: code },
    include: { route: true },
  })
  if (!session) return null
  const faster = await prisma.huntSession.count({
    where: {
      routeId: session.routeId,
      status: 'finished',
      isTest: false,
      durationMs: { lt: session.durationMs ?? 0 },
    },
  })
  return { session, route: session.route, rank: faster + 1 }
}

export async function sessionByCode(code: string | null | undefined): Promise<HuntSession | null> {
  if (!code) return null
  return prisma.huntSession.findUnique({ where: { code } })
}

export async function sessionState(code: string | null | undefined): Promise<SessionState | null> {
  const session = await sessionByCode(code)
  if (!session) return null
  const route = await prisma.route.findUnique({ where: { id: session.routeId } })
  if (!route) return null
  const steps = await prisma.sessionStep.findMany({
    where: { sessionId: session.id },
    orderBy: { stepNo: 'asc' },
    include: { poster: true },
  })
  const currentIdx = steps.findIndex((s) => s.scannedAt === null)
  const current = currentIdx >= 0 ? steps[currentIdx] : null
  return {
    code: session.code,
    name: session.name,
    mode: session.mode,
    section: session.section,
    joinCode: session.joinCode,
    claimCode: session.claimCode,
    redeemedAt: session.redeemedAt?.toISOString() ?? null,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    finishedAt: session.finishedAt?.toISOString() ?? null,
    durationMs: session.durationMs,
    route: {
      id: route.id,
      nameAr: route.nameAr,
      nameEn: route.nameEn,
      section: route.section,
      status: route.status,
    },
    total: steps.length,
    done: currentIdx < 0 ? steps.length : currentIdx,
    current: current
      ? {
          stepNo: current.stepNo,
          nameAr: current.poster.nameAr,
          nameEn: current.poster.nameEn,
          riddleAr: current.poster.riddleAr,
          riddleEn: current.poster.riddleEn,
          humanCode: current.poster.humanCode,
        }
      : null,
  }
}

async function logScan(input: {
  sessionId: number | null
  posterId: number | null
  token: string
  accepted: boolean
  reason: string
  ua: string
}) {
  await prisma.scan.create({ data: input })
}

/** Resolve a token against a session. The poster is team agnostic, the order is not. */
export async function resolveScan(session: HuntSession | null, rawCode: string, ua: string): Promise<ScanResult> {
  const code = rawCode.trim().toUpperCase()
  const poster = await prisma.poster.findFirst({
    where: { OR: [{ token: code }, { humanCode: code }] },
  })

  if (!poster) {
    await logScan({ sessionId: session?.id ?? null, posterId: null, token: code, accepted: false, reason: 'unknown_code', ua })
    return { kind: 'invalid' }
  }
  if (!session) {
    await logScan({ sessionId: null, posterId: poster.id, token: code, accepted: false, reason: 'no_session', ua })
    return { kind: 'no_session' }
  }
  if (session.status === 'finished') {
    await logScan({ sessionId: session.id, posterId: poster.id, token: code, accepted: false, reason: 'already_finished', ua })
    return { kind: 'finished', posterName: { ar: poster.nameAr, en: poster.nameEn } }
  }
  if (poster.routeId !== session.routeId || !poster.active) {
    await logScan({ sessionId: session.id, posterId: poster.id, token: code, accepted: false, reason: 'other_route', ua })
    return { kind: 'other_route' }
  }

  const steps = await prisma.sessionStep.findMany({
    where: { sessionId: session.id },
    orderBy: { stepNo: 'asc' },
    include: { poster: true },
  })
  const current = steps.find((s) => s.scannedAt === null)
  if (!current) return { kind: 'finished', posterName: null }

  if (poster.id === current.posterId) {
    await prisma.sessionStep.update({ where: { id: current.id }, data: { scannedAt: new Date() } })
    await logScan({ sessionId: session.id, posterId: poster.id, token: code, accepted: true, reason: 'advance', ua })

    const remaining = steps.filter((s) => s.stepNo > current.stepNo)
    if (remaining.length === 0) {
      await finishSession(session.id, session.startedAt)
      return { kind: 'advance', posterName: { ar: poster.nameAr, en: poster.nameEn }, next: null, finished: true }
    }
    const next = remaining[0].poster
    return {
      kind: 'advance',
      posterName: { ar: poster.nameAr, en: poster.nameEn },
      next: { ar: next.riddleAr, en: next.riddleEn },
      finished: false,
    }
  }

  const already = steps.some((s) => s.posterId === poster.id && s.scannedAt !== null)
  if (already) {
    await logScan({ sessionId: session.id, posterId: poster.id, token: code, accepted: false, reason: 'repeat', ua })
    return { kind: 'repeat', next: { ar: current.poster.riddleAr, en: current.poster.riddleEn } }
  }

  await logScan({ sessionId: session.id, posterId: poster.id, token: code, accepted: false, reason: 'not_yet', ua })
  return { kind: 'not_yet' }
}

export async function joinSession(joinCode: string) {
  const session = await prisma.huntSession.findFirst({
    where: { joinCode: joinCode.trim().toUpperCase(), status: 'active' },
  })
  return session
}

export type BoardRow = { rank: number; name: string; mode: SessionMode; durationMs: number }

export async function leaderboard(routeId: number, take = 20): Promise<BoardRow[]> {
  const rows = await prisma.huntSession.findMany({
    where: { routeId, status: 'finished', isTest: false, durationMs: { not: null } },
    orderBy: { durationMs: 'asc' },
    take,
    select: { name: true, mode: true, durationMs: true },
  })
  return rows.map((r, i) => ({ rank: i + 1, name: r.name, mode: r.mode, durationMs: r.durationMs ?? 0 }))
}

export async function finishSummary(session: HuntSession) {
  const route = await prisma.route.findUnique({ where: { id: session.routeId } })
  const baseUrl = (await prisma.setting.findUnique({ where: { key: 'base_url' } }))?.value ?? ''
  const faster = await prisma.huntSession.count({
    where: {
      routeId: session.routeId,
      status: 'finished',
      isTest: false,
      durationMs: { lt: session.durationMs ?? 0 },
    },
  })
  return {
    route: route && { id: route.id, nameAr: route.nameAr, nameEn: route.nameEn, section: route.section },
    rank: session.status === 'finished' ? faster + 1 : null,
    claimCode: session.claimCode,
    claimUrl: session.claimCode ? `${baseUrl.replace(/\/$/, '')}/v/${session.claimCode}` : null,
    redeemedAt: session.redeemedAt?.toISOString() ?? null,
    board: await leaderboard(session.routeId, 10),
  }
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return ''
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

export type { HuntSession, Poster, Route, Section }
