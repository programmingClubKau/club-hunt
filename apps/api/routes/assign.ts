import type { RouteModule } from '../src/types/globals'
import { assignRoute } from '../src/lib/game'

const route: RouteModule = {
  method: 'GET',
  path: '/routes/:section/assign',
  async handler(req) {
    const section = (req.params as { section: string }).section
    if (section !== 'male' && section !== 'female') {
      return { ok: false, error: 'bad_section' }
    }
    const routeId = await assignRoute(section)
    return { ok: true, routeId }
  },
}

export default route
