import type { FastifyReply, FastifyRequest } from 'fastify'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface RouteModule {
  method: HttpMethod | HttpMethod[]
  path: string
  handler: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown> | unknown
  auth?: 'admin' | 'none'
}

declare module 'fastify' {
  interface FastifyContextConfig {
    auth?: 'admin' | 'none'
  }
}
