import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/settings')({
  loader: async () => {
    const res = await api.raw('/admin/settings')
    if (res.status === 401) throw redirect({ to: '/admin/login' })
    return res.json as { ok: boolean; baseUrl: string }
  },
  component: Settings,
})

function Settings() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const [baseUrl, setBaseUrl] = useState(data.baseUrl)
  const [saved, setSaved] = useState(false)

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <form
        className="form"
        onSubmit={async (event) => {
          event.preventDefault()
          await api.adminSaveSettings(baseUrl)
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
          await router.invalidate()
        }}
      >
        <label className="field">
          <span className="label">Public base URL (used inside printed QR codes)</span>
          <input
            className="input"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://192.168.68.105:3080"
          />
        </label>
        <p className="dim small">
          Whatever host players really use. Every printed QR bakes this in, so set it before printing.
        </p>
        <button className="btn primary" type="submit">
          {saved ? 'Saved' : 'Save'}
        </button>
      </form>

      <h2 className="sec-title">Stack</h2>
      <p className="dim">
        TanStack Start on :3080 · Fastify on :8794 · PostgreSQL 18 (alpine) in Docker on :5433 · Prisma.
      </p>
      <h2 className="sec-title">Password</h2>
      <p className="dim">
        Set <code>ADMIN_PASSWORD</code> in <code>apps/api/.env</code> and restart the API.
      </p>
    </>
  )
}
