import { readdir } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { RouteModule } from '../src/types/globals'

/**
 * Loads one file per endpoint from routes/.
 * Sorted so a parameterised path and a static path never fight over registration order.
 */
export async function loadRoutes(fastify: FastifyInstance, dir?: string): Promise<string[]> {
  const root = dir ?? resolve(import.meta.dir, '..', 'routes')
  const entries = await readdir(root)
  const files = entries
    .filter((f) => ['.ts', '.js'].includes(extname(f)))
    .filter((f) => !f.endsWith('.d.ts') && !f.includes('.test.') && !f.includes('.spec.'))
    .sort()

  const registered: string[] = []
  for (const file of files) {
    const mod = (await import(`${resolve(root, file)}?v=${Date.now()}`)) as { default?: RouteModule }
    const route = mod.default
    if (!route || typeof route.handler !== 'function' || !route.path || !route.method) {
      throw new Error(`Route module ${file} must export { method, path, handler }`)
    }
    const methods = Array.isArray(route.method) ? route.method : [route.method]
    for (const method of methods) {
      fastify.route({
        method,
        url: route.path,
        handler: route.handler,
        config: { auth: route.auth ?? 'none' },
      })
      registered.push(`${method} ${route.path}`)
    }
  }
  return registered
}
