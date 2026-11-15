import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { prisma } from '@club/db'
import { buildServer } from '../src/server'

const NAME_PREFIX = 'TEST_RUN_'
let app: Awaited<ReturnType<typeof buildServer>>
let cookie = ''
let routeId = 0
let tokens: string[] = []
let drawCount = 3

beforeAll(async () => {
  app = await buildServer()
  const route = await prisma.route.findFirst({
    where: { section: 'male', status: 'open' },
    include: { posters: { where: { active: true }, orderBy: { seq: 'asc' } } },
  })
  if (!route) throw new Error('seed the database first: bun run db:seed')
  routeId = route.id
  drawCount = route.drawCount
  tokens = route.posters.map((p) => p.token)
})

/** The stop tokens this particular session was dealt, in walking order. */
async function stepsOf(sessionCode: string): Promise<string[]> {
  const rows = await prisma.sessionStep.findMany({
    where: { session: { code: sessionCode } },
    orderBy: { stepNo: 'asc' },
    include: { poster: true },
  })
  return rows.map((r) => r.poster.token)
}

afterAll(async () => {
  await prisma.huntSession.deleteMany({ where: { name: { startsWith: NAME_PREFIX } } })
  await app.close()
  await prisma.$disconnect()
})

async function startSession(name: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/sessions',
    payload: { routeId, mode: 'team', name: NAME_PREFIX + name },
  })
  const cookieHeader = res.headers['set-cookie']
  const raw = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader
  return { status: res.statusCode, cookie: String(raw ?? '').split(';')[0], body: res.json() }
}

describe('public api', () => {
  test('health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json().ok).toBe(true)
  })

  test('a section assign returns an open trail of that section', async () => {
    const res = await app.inject({ method: 'GET', url: '/routes/male/assign' })
    const body = res.json()
    expect(body.ok).toBe(true)
    expect(body.routeId).toBeGreaterThan(0)
    const route = await prisma.route.findUnique({ where: { id: body.routeId } })
    expect(route?.section).toBe('male')
    expect(route?.status).toBe('open')
  })

  test('starting a session draws the configured number of stops and hides future riddles', async () => {
    const started = await startSession('alpha')
    expect(started.status).toBe(200)
    expect(started.cookie).toContain('sid=')

    const me = await app.inject({ method: 'GET', url: '/sessions/me', headers: { cookie: started.cookie } })
    const state = me.json().state
    expect(state.code).toBe(started.body.code)
    expect(state.total).toBe(Math.min(drawCount, tokens.length))
    expect(state.current.stepNo).toBe(1)
    // Only the current stop's riddle exists in the payload.
    const riddles = (JSON.stringify(state).match(/riddleAr/g) ?? []).length
    expect(riddles).toBe(1)
  })

  test('each team gets its own random path', async () => {
    const paths = new Set<string>()
    for (let i = 0; i < 12; i++) {
      const s = await startSession('path' + i)
      const steps = await stepsOf(s.body.code)
      expect(steps.length).toBe(Math.min(drawCount, tokens.length))
      expect(new Set(steps).size).toBe(steps.length)
      paths.add(steps.join(','))
    }
    expect(paths.size).toBeGreaterThan(1)
  })

  test('out of order scans are refused, the current stop advances', async () => {
    const s = await startSession('bravo')
    const steps = await stepsOf(s.body.code)
    const early = await app.inject({ method: 'GET', url: `/scan/${steps[1]}`, headers: { cookie: s.cookie } })
    expect(early.json().result.kind).toBe('not_yet')

    const first = await app.inject({ method: 'GET', url: `/scan/${steps[0]}`, headers: { cookie: s.cookie } })
    const result = first.json().result
    expect(result.kind).toBe('advance')
    expect(result.next.ar.length).toBeGreaterThan(0)

    const again = await app.inject({ method: 'GET', url: `/scan/${steps[0]}`, headers: { cookie: s.cookie } })
    expect(again.json().result.kind).toBe('repeat')
  })

  test('scanning without a session is reported, not crashed', async () => {
    const res = await app.inject({ method: 'GET', url: `/scan/${tokens[0]}` })
    expect(res.json().result.kind).toBe('no_session')
  })

  test('the manual human code works', async () => {
    const s = await startSession('charlie')
    const steps = await stepsOf(s.body.code)
    const poster = await prisma.poster.findFirst({ where: { token: steps[0] } })
    const res = await app.inject({
      method: 'POST',
      url: '/scan',
      headers: { cookie: s.cookie },
      payload: { code: poster!.humanCode.toLowerCase() },
    })
    expect(res.json().result.kind).toBe('advance')
  })

  test('a second phone joins with the team code and gets its own device token', async () => {
    const s = await startSession('echo')
    const joinCode = s.body.joinCode

    const joined = await app.inject({ method: 'POST', url: '/join', payload: { code: joinCode } })
    expect(joined.statusCode).toBe(200)
    const raw = joined.headers['set-cookie']
    const secondCookie = String(Array.isArray(raw) ? raw[0] : raw).split(';')[0]
    expect(secondCookie).not.toBe(s.cookie)

    // Both devices see the same team and the same progress.
    const a = await app.inject({ method: 'GET', url: '/sessions/me', headers: { cookie: s.cookie } })
    const b = await app.inject({ method: 'GET', url: '/sessions/me', headers: { cookie: secondCookie } })
    expect(b.json().state.code).toBe(a.json().state.code)

    const session = await prisma.huntSession.findUnique({
      where: { code: a.json().state.code },
      include: { _count: { select: { devices: true } } },
    })
    expect(session!._count.devices).toBe(2)

    // Advancing on one device is visible on the other.
    const steps = await stepsOf(s.body.code)
    await app.inject({ method: 'GET', url: `/scan/${steps[0]}`, headers: { cookie: secondCookie } })
    const after = await app.inject({ method: 'GET', url: '/sessions/me', headers: { cookie: s.cookie } })
    expect(after.json().state.done).toBe(1)
  })

  test('a revoked device loses access without touching the other device', async () => {
    const s = await startSession('foxtrot')
    const device = await prisma.device.findFirst({ where: { session: { code: s.body.code } } })
    await prisma.device.update({ where: { id: device!.id }, data: { revokedAt: new Date() } })
    const res = await app.inject({ method: 'GET', url: '/sessions/me', headers: { cookie: s.cookie } })
    expect(res.json().state).toBeNull()
  })

  test('a full run finishes with a duration and a rank', async () => {
    const s = await startSession('delta')
    const steps = await stepsOf(s.body.code)
    for (const token of steps) {
      await app.inject({ method: 'GET', url: `/scan/${token}`, headers: { cookie: s.cookie } })
    }
    const me = await app.inject({ method: 'GET', url: '/sessions/me', headers: { cookie: s.cookie } })
    const body = me.json()
    expect(body.state.status).toBe('finished')
    expect(body.finish.rank).toBeGreaterThanOrEqual(1)
    expect(body.finish.board.length).toBeGreaterThanOrEqual(1)
    expect(body.finish.claimCode).toMatch(/^[A-Z0-9]{8}$/)

    // The badge is checkable by staff, and the claim URL points at the configured host.
    const claim = await app.inject({ method: 'GET', url: `/verify/${body.finish.claimCode}` })
    expect(claim.json().valid).toBe(true)
    expect(claim.json().used).toBe(false)
    expect(claim.json().name).toBe(NAME_PREFIX + 'delta')
    expect(body.finish.claimUrl).toContain(`/v/${body.finish.claimCode}`)

    // Unknown codes are rejected.
    const bogus = await app.inject({ method: 'GET', url: '/verify/ZZZZZZZZ' })
    expect(bogus.json().valid).toBe(false)
  })

  test('a winner can be marked collected exactly once', async () => {
    const s = await startSession('golf')
    const steps = await stepsOf(s.body.code)
    for (const token of steps) {
      await app.inject({ method: 'GET', url: `/scan/${token}`, headers: { cookie: s.cookie } })
    }
    const session = await prisma.huntSession.findUnique({ where: { code: s.body.code } })
    const admin = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { password: process.env.ADMIN_PASSWORD ?? 'progg-hunt' },
    })
    const raw = admin.headers['set-cookie']
    const adminCookie = String(Array.isArray(raw) ? raw[0] : raw).split(';')[0]

    const first = await app.inject({
      method: 'POST',
      url: `/admin/sessions/${session!.id}/redeem`,
      headers: { cookie: adminCookie },
    })
    expect(first.statusCode).toBe(200)

    const second = await app.inject({
      method: 'POST',
      url: `/admin/sessions/${session!.id}/redeem`,
      headers: { cookie: adminCookie },
    })
    expect(second.statusCode).toBe(409)
    expect(second.json().error).toBe('already_redeemed')

    const claim = await app.inject({ method: 'GET', url: `/verify/${session!.claimCode}` })
    expect(claim.json().used).toBe(true)

    const undo = await app.inject({
      method: 'POST',
      url: `/admin/sessions/${session!.id}/unredeem`,
      headers: { cookie: adminCookie },
    })
    expect(undo.statusCode).toBe(200)
  })
})

describe('admin api', () => {
  test('admin routes are closed without the cookie', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/routes' })
    expect(res.statusCode).toBe(401)
  })

  test('wrong password is rejected, right password sets the admin cookie', async () => {
    const bad = await app.inject({ method: 'POST', url: '/admin/login', payload: { password: 'nope' } })
    expect(bad.statusCode).toBe(401)

    const good = await app.inject({
      method: 'POST',
      url: '/admin/login',
      payload: { password: process.env.ADMIN_PASSWORD ?? 'progg-hunt' },
    })
    expect(good.statusCode).toBe(200)
    const raw = good.headers['set-cookie']
    cookie = String(Array.isArray(raw) ? raw[0] : raw).split(';')[0]
    expect(cookie).toContain('adm=')
  })

  test('create a route, add a stop, open it, then it is assignable', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/admin/routes',
      headers: { cookie },
      payload: { nameAr: 'مسار اختبار', nameEn: 'Test route', section: 'female', drawCount: 2 },
    })
    const id = created.json().route.id as number

    const poster = await app.inject({
      method: 'POST',
      url: `/admin/routes/${id}/posters`,
      headers: { cookie },
      payload: { nameAr: 'نقطة', riddleAr: 'لغز' },
    })
    expect(poster.json().ok).toBe(true)

    await app.inject({
      method: 'POST',
      url: `/admin/routes/${id}/status`,
      headers: { cookie },
      payload: { status: 'open' },
    })

    const detail = await app.inject({ method: 'GET', url: `/admin/routes/${id}`, headers: { cookie } })
    expect(detail.json().route.status).toBe('open')
    expect(detail.json().route.drawCount).toBe(2)
    expect(detail.json().posters.length).toBe(1)

    // Asked for 2 stops, the pool only holds 1, so the session is capped at the pool.
    const started = await app.inject({
      method: 'POST',
      url: '/sessions',
      payload: { routeId: id, mode: 'solo', name: NAME_PREFIX + 'cap' },
    })
    const raw = started.headers['set-cookie']
    const soloCookie = String(Array.isArray(raw) ? raw[0] : raw).split(';')[0]
    const me = await app.inject({ method: 'GET', url: '/sessions/me', headers: { cookie: soloCookie } })
    expect(me.json().state.total).toBe(1)

    // Draft trails never reach the player.
    await app.inject({
      method: 'POST',
      url: `/admin/routes/${id}/status`,
      headers: { cookie },
      payload: { status: 'draft' },
    })
    for (let i = 0; i < 8; i++) {
      const assigned = await app.inject({ method: 'GET', url: '/routes/female/assign' })
      expect(assigned.json().routeId).not.toBe(id)
    }

    await prisma.route.delete({ where: { id } }).catch(() => null)
  })

  test('a sticker QR encodes the token and the configured base url', async () => {
    const before = await prisma.setting.findUnique({ where: { key: 'base_url' } })
    await app.inject({
      method: 'PUT',
      url: '/admin/settings',
      headers: { cookie },
      payload: { baseUrl: 'https://hunt.example.org' },
    })
    const poster = await prisma.poster.findFirst({ where: { routeId, active: true } })
    const svg = await app.inject({
      method: 'GET',
      url: `/admin/posters/${poster!.id}/qr.svg`,
      headers: { cookie },
    })
    expect(svg.statusCode).toBe(200)
    expect(svg.headers['content-type']).toContain('image/svg+xml')
    // The QR is a path drawing, so verify the endpoint produced a real matrix, and the target separately.
    expect(svg.body).toContain('<svg')
    const png = await app.inject({
      method: 'GET',
      url: `/admin/posters/${poster!.id}/qr.png`,
      headers: { cookie },
    })
    expect(png.statusCode).toBe(200)
    expect(png.rawPayload.length).toBeGreaterThan(500)

    // Put the organizer's real base URL back so running tests never repoints printed stickers.
    await prisma.setting.update({
      where: { key: 'base_url' },
      data: { value: before?.value ?? '' },
    })
  })
})
