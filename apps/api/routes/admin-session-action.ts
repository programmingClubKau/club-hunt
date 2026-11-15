import type { RouteModule } from '../src/types/globals'
import { prisma } from '@club/db'
import { finishSession } from '../src/lib/game'

const route: RouteModule = {
  method: 'POST',
  path: '/admin/sessions/:id/:action',
  auth: 'admin',
  async handler(req, reply) {
    const id = Number((req.params as { id: string }).id)
    const action = (req.params as { action: string }).action as
      | 'advance'
      | 'reset'
      | 'test'
      | 'redeem'
      | 'unredeem'
    const session = await prisma.huntSession.findUnique({ where: { id } })
    if (!session) return reply.code(404).send({ ok: false, error: 'not_found' })

    if (action === 'advance') {
      const current = await prisma.sessionStep.findFirst({
        where: { sessionId: id, scannedAt: null },
        orderBy: { stepNo: 'asc' },
      })
      if (current) {
        await prisma.sessionStep.update({ where: { id: current.id }, data: { scannedAt: new Date() } })
        const remaining = await prisma.sessionStep.count({ where: { sessionId: id, scannedAt: null } })
        if (remaining === 0) await finishSession(session.id, session.startedAt)
      }
      return { ok: true }
    }

    if (action === 'reset') {
      await prisma.huntSession.delete({ where: { id } })
      return { ok: true }
    }

    if (action === 'test') {
      await prisma.huntSession.update({ where: { id }, data: { isTest: !session.isTest } })
      return { ok: true }
    }

    // Booth redemption: the same badge cannot be cashed twice.
    if (action === 'redeem') {
      if (session.status !== 'finished') return reply.code(409).send({ ok: false, error: 'not_finished' })
      if (session.redeemedAt) {
        return reply.code(409).send({ ok: false, error: 'already_redeemed', redeemedAt: session.redeemedAt })
      }
      const updated = await prisma.huntSession.update({ where: { id }, data: { redeemedAt: new Date() } })
      return { ok: true, redeemedAt: updated.redeemedAt }
    }

    if (action === 'unredeem') {
      await prisma.huntSession.update({ where: { id }, data: { redeemedAt: null } })
      return { ok: true }
    }

    return reply.code(400).send({ ok: false, error: 'bad_action' })
  },
}

export default route
