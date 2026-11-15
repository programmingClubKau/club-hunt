import type { RouteModule } from '../src/types/globals'
import { finishSummary, sessionByCode, sessionByDeviceToken, sessionState } from '../src/lib/game'
import { readDeviceToken } from '../src/lib/cookies'

const route: RouteModule = {
  method: 'GET',
  path: '/sessions/me',
  async handler(req) {
    const deviceSession = await sessionByDeviceToken(readDeviceToken(req))
    if (!deviceSession) return { ok: true, state: null, finish: null }
    const state = await sessionState(deviceSession.code)
    if (!state) return { ok: true, state: null, finish: null }
    const session = await sessionByCode(state.code)
    const finish = session && session.status === 'finished' ? await finishSummary(session) : null
    return { ok: true, state, finish }
  },
}

export default route
