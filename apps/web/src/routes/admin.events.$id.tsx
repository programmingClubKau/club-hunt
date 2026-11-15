import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/events/$id')({
  loader: async ({ params }) => {
    const res = await api.raw(`/admin/routes/${params.id}`)
    if (res.status === 401) throw redirect({ to: '/admin/login' })
    const data = res.json as { ok: boolean; route?: any; posters?: any[] }
    if (!data.ok || !data.route) throw redirect({ to: '/admin' })
    return { event: data.route, codes: data.posters ?? [] }
  },
  component: EventEditor,
})

function EventEditor() {
  const { event, codes } = Route.useLoaderData()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function addCode(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    if (busy) return
    setBusy(true)
    const form = new FormData(formEvent.currentTarget)
    const res = await api.adminAddPoster(event.id, {
      nameAr: String(form.get('nameAr') ?? ''),
      nameEn: String(form.get('nameEn') ?? ''),
      riddleAr: String(form.get('riddleAr') ?? ''),
      riddleEn: String(form.get('riddleEn') ?? ''),
    })
    setBusy(false)
    if (!res.ok) {
      alert('Could not add the QR code. Check the name and the riddle.')
      return
    }
    ;(formEvent.target as HTMLFormElement).reset()
    await router.invalidate()
  }

  return (
    <>
      <a className="crumb" href="/admin">
        ← All events
      </a>
      <h1 className="page-title">
        {event.nameAr} {event.nameEn ? <span className="dim">/ {event.nameEn}</span> : null}
      </h1>

      <div className="metric-strip">
        <span className={`pill ${event.status}`}>{event.status}</span>
        <span className="pill">{event.section}</span>
        <strong>
          {codes.length} QR {codes.length === 1 ? 'code' : 'codes'}
        </strong>
        <span className="dim">draws {event.drawCount} per team</span>
      </div>

      <div className="cta-row">
        <a className="btn" href={`/admin/stickers/${event.id}`}>
          Print QR sheet
        </a>
        <a className="btn" href={`/api/admin/routes/${event.id}/export.csv`}>
          Export CSV
        </a>
        <a className="btn" href={`/admin/sessions/${event.id}`}>
          Live sessions
        </a>
      </div>

      <form
        className="form"
        onSubmit={async (formEvent) => {
          formEvent.preventDefault()
          const form = new FormData(formEvent.currentTarget)
          const status = String(form.get('status') ?? 'draft')
          const drawCount = Number(form.get('drawCount') ?? event.drawCount)
          await api.adminStatus(event.id, status as 'draft' | 'open' | 'closed')
          await api.adminUpdateRoute(event.id, { drawCount })
          await router.invalidate()
        }}
      >
        <label className="field">
          <span className="label">Status</span>
          <select className={`input status-${event.status}`} name="status" defaultValue={event.status}>
            <option value="draft">draft</option>
            <option value="open">open</option>
            <option value="closed">closed</option>
          </select>
        </label>
        <label className="field">
          <span className="label">QR codes per team</span>
          <input className="input" type="number" name="drawCount" min={1} max={50} defaultValue={event.drawCount} />
        </label>
        <button className="btn" type="submit">
          Save settings
        </button>
      </form>

      <p className="dim small">
        Every team draws {event.drawCount} of these {codes.length} QR codes at random, in random order. Riddles are never
        sent to a phone until that stop is unlocked.
      </p>

      <h2 className="sec-title">QR codes ({codes.length})</h2>
      <div className="list">
        {codes.map((code: any, i: number) => (
          <div className={`card poster-row${code.active ? '' : ' off'}`} key={code.id}>
            <img className="qr-thumb" src={`/api/admin/posters/${code.id}/qr.png`} alt={`QR ${code.token}`} />
            <div className="card-main">
              <strong>
                {i + 1}. {code.nameAr} <span className="dim">{code.nameEn}</span>
              </strong>
              <span className="dim small">{String(code.riddleAr).slice(0, 70)}</span>
              <span className="tiny-line">
                {code.token} · {code.humanCode} {code.active ? '' : '· disabled'}
              </span>
            </div>
            <div className="row-actions">
              <a className="btn tiny" href={`/admin/posters/${code.id}`}>
                Edit
              </a>
              <a className="btn tiny" href={`/api/admin/posters/${code.id}/qr.png?download=1`}>
                QR file
              </a>
              <button
                className="btn tiny"
                type="button"
                disabled={i === 0}
                onClick={async () => {
                  await api.adminMovePoster(code.id, -1)
                  await router.invalidate()
                }}
              >
                ↑
              </button>
              <button
                className="btn tiny"
                type="button"
                disabled={i === codes.length - 1}
                onClick={async () => {
                  await api.adminMovePoster(code.id, 1)
                  await router.invalidate()
                }}
              >
                ↓
              </button>
              <button
                className="btn tiny danger"
                type="button"
                onClick={async () => {
                  if (!confirm('Delete this QR code? Printed stickers for it stop working.')) return
                  await api.adminDeletePoster(code.id)
                  await router.invalidate()
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {codes.length === 0 ? <p className="empty">No QR codes in this event yet. Add the first one below.</p> : null}

      <h2 className="sec-title">Add a QR code</h2>
      <p className="dim small">
        One QR code per place. Add as many as you need, the list above keeps growing and prints in order.
      </p>
      <form className="form" onSubmit={addCode}>
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
          {busy ? 'Adding…' : 'Add QR code'}
        </button>
      </form>
    </>
  )
}
