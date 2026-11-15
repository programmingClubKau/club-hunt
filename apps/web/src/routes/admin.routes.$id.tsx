import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/routes/$id')({
  loader: async ({ params }) => {
    const res = await api.raw(`/admin/routes/${params.id}`)
    if (res.status === 401) throw redirect({ to: '/admin/login' })
    const data = res.json as { ok: boolean; route?: any; posters?: any[] }
    if (!data.ok || !data.route) throw redirect({ to: '/admin' })
    return { route: data.route, posters: data.posters ?? [] }
  },
  component: RouteEditor,
})

function RouteEditor() {
  const { route, posters } = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function addPoster(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    const form = new FormData(event.currentTarget)
    await api.adminAddPoster(route.id, {
      nameAr: String(form.get('nameAr') ?? ''),
      nameEn: String(form.get('nameEn') ?? ''),
      riddleAr: String(form.get('riddleAr') ?? ''),
      riddleEn: String(form.get('riddleEn') ?? ''),
    })
    setBusy(false)
    ;(event.target as HTMLFormElement).reset()
    await router.invalidate()
  }

  return (
    <>
      <a className="crumb" href="/admin">
        ← All routes
      </a>
      <h1 className="page-title">
        {route.nameAr} · {route.section}
      </h1>

      <div className="cta-row">
        <a className="btn" href={`/admin/stickers/${route.id}`}>
          Print stickers
        </a>
        <a className="btn" href={`/api/admin/routes/${route.id}/export.csv`}>
          Export CSV
        </a>
        <a className="btn" href={`/admin/sessions/${route.id}`}>
          Live sessions
        </a>
      </div>

      <form
        className="form"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const status = String(form.get('status') ?? 'draft')
          const drawCount = Number(form.get('drawCount') ?? route.drawCount)
          await api.adminStatus(route.id, status as 'draft' | 'open' | 'closed')
          await api.adminUpdateRoute(route.id, { drawCount })
          await router.invalidate()
        }}
      >
        <label className="field">
          <span className="label">Status</span>
          <select className={`input status-${route.status}`} name="status" defaultValue={route.status}>
            <option value="draft">draft</option>
            <option value="open">open</option>
            <option value="closed">closed</option>
          </select>
        </label>
        <label className="field">
          <span className="label">Spots per team</span>
          <input
            className="input"
            type="number"
            name="drawCount"
            min={1}
            max={50}
            defaultValue={route.drawCount}
          />
        </label>
        <button className="btn" type="submit">
          Save settings
        </button>
      </form>

      <p className="dim">
        Each team draws {route.drawCount} of the {posters.length} stops below at random, in random order. Every team on
        this trail walks its own path. Riddles are never sent to a phone until that stop is unlocked.
      </p>

      <div className="list">
        {posters.map((p: any, i: number) => (
          <div className={`card poster-row${p.active ? '' : ' off'}`} key={p.id}>
            <div className="card-main">
              <strong>
                {i + 1}. {p.nameAr} <span className="dim">{p.nameEn}</span>
              </strong>
              <span className="dim small">{String(p.riddleAr).slice(0, 70)}</span>
              <span className="tiny-line">
                {p.token} · {p.humanCode} {p.active ? '' : '· disabled'}
              </span>
            </div>
            <div className="row-actions">
              <a className="btn tiny" href={`/admin/posters/${p.id}`}>
                Edit
              </a>
              <a className="btn tiny" href={`/api/admin/posters/${p.id}/qr.png`}>
                QR
              </a>
              <button
                className="btn tiny"
                type="button"
                disabled={i === 0}
                onClick={async () => {
                  await api.adminMovePoster(p.id, -1)
                  await router.invalidate()
                }}
              >
                ↑
              </button>
              <button
                className="btn tiny"
                type="button"
                disabled={i === posters.length - 1}
                onClick={async () => {
                  await api.adminMovePoster(p.id, 1)
                  await router.invalidate()
                }}
              >
                ↓
              </button>
              <button
                className="btn tiny danger"
                type="button"
                onClick={async () => {
                  if (!confirm('Delete this stop and its QR?')) return
                  await api.adminDeletePoster(p.id)
                  await router.invalidate()
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {posters.length === 0 ? <p className="empty">No stops in this route yet.</p> : null}

      <h2 className="sec-title">Add a stop</h2>
      <form className="form" onSubmit={addPoster}>
        <label className="field">
          <span className="label">Place name (Arabic)</span>
          <input className="input" name="nameAr" required dir="rtl" placeholder="المكتبة" />
        </label>
        <label className="field">
          <span className="label">Place name (English, optional)</span>
          <input className="input" name="nameEn" placeholder="The library" />
        </label>
        <label className="field">
          <span className="label">Riddle (Arabic)</span>
          <textarea className="input" name="riddleAr" rows={4} required dir="rtl" />
        </label>
        <label className="field">
          <span className="label">Riddle (English, optional)</span>
          <textarea className="input" name="riddleEn" rows={4} />
        </label>
        <button className="btn primary big" type="submit" disabled={busy}>
          Add stop
        </button>
      </form>
    </>
  )
}
