import server from './dist/server/server.js'

const port = Number(process.env.PORT ?? 3080)

const instance = Bun.serve({
  port,
  hostname: '0.0.0.0',
  idleTimeout: 60,
  fetch: server.fetch,
})

console.log(`web listening on http://${instance.hostname}:${instance.port}`)
