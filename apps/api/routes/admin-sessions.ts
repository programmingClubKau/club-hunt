import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'

const route: RouteModule = {
  method: 'GET',
  path: '/admin/routes/:id/sessions',
  auth: 'admin',
  async handler(req, reply) {
    const routeId = Number((req.params as { id: string }).id)
    const route = await prisma.route.findUnique({ where: { id: routeId } })
    if (!route) return reply.code(404).send({ ok: false, error: 'not_found' })

    const sessions = await prisma.huntSession.findMany({
      where: { routeId },
      orderBy: { startedAt: 'desc' },
      include: {
        _count: { select: { steps: true, devices: true } },
        steps: { where: { scannedAt: null }, select: { stepNo: true } },
      },
    })
    const now = Date.now()
    return {
      ok: true,
      route: { id: route.id, nameAr: route.nameAr },
      sessions: sessions.map((s) => ({
        id: s.id,
        name: s.name,
        mode: s.mode,
        joinCode: s.joinCode,
        isTest: s.isTest,
        status: s.status,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        durationMs: s.durationMs,
        elapsedMs: s.status === 'active' ? now - s.startedAt.getTime() : s.durationMs,
        total: s._count.steps,
        step: s.steps.length ? Math.min(...s.steps.map((x) => x.stepNo)) : s._count.steps,
        finishedSteps: s._count.steps - s.steps.length,
        claimCode: s.claimCode,
        redeemedAt: s.redeemedAt,
        devices: s._count.devices,
      })),
    }
  },
}

export default route
