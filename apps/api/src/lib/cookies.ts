import type { FastifyReply, FastifyRequest } from 'fastify'

const COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  signed: true,
  maxAge: 60 * 60 * 24 * 14,
}

/** The player cookie holds one device token, never the team credential. */
export function setDeviceCookie(reply: FastifyReply, deviceToken: string) {
  reply.setCookie('sid', deviceToken, COOKIE_OPTS)
}

export function readDeviceToken(req: FastifyRequest): string | null {
  const raw = req.cookies.sid
  if (!raw) return null
  const result = req.unsignCookie(raw)
  return result.valid ? result.value : null
}

export function clearDeviceCookie(reply: FastifyReply) {
  reply.clearCookie('sid', { path: '/' })
}

export function setAdminCookie(reply: FastifyReply) {
  reply.setCookie('adm', 'ok', COOKIE_OPTS)
}

export function clearAdminCookie(reply: FastifyReply) {
  reply.clearCookie('adm', { path: '/' })
}
