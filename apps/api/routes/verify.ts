import type { RouteModule } from '../src/types/globals'
import { claimInfo } from '../src/lib/game'

/**
 * Staff-facing check for the winner badge. Public by necessity (the booth scans it),
 * but the code is 8 random characters and only exists after a session finishes.
 */
const route: RouteModule = {
  method: 'GET',
  path: '/verify/:code',
  async handler(req) {
    const info = await claimInfo((req.params as { code: string }).code)
    if (!info) return { ok: true, valid: false, used: false }
    return {
      ok: true,
      valid: info.session.status === 'finished',
      used: Boolean(info.session.redeemedAt),
      sessionId: info.session.id,
      redeemedAt: info.session.redeemedAt?.toISOString() ?? null,
      isTest: info.session.isTest,
      name: info.session.name,
      mode: info.session.mode,
      section: info.session.section,
      route: info.route.nameAr,
      durationMs: info.session.durationMs,
      rank: info.rank,
      finishedAt: info.session.finishedAt?.toISOString() ?? null,
      claimCode: info.session.claimCode,
    }
  },
}

export default route
