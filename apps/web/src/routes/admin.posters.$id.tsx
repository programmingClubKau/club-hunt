import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/posters/$id')({
  loader: async ({ params }) => {
    const res = await api.raw(`/admin/posters/${params.id}`)
    if (res.status === 401) throw redirect({ to: '/admin/login' })
    const data = res.json as { ok: boolean; poster?: any; route?: { id: number; nameAr: string } }
    if (!data.ok || !data.poster || !data.route) throw redirect({ to: '/admin' })
    return { poster: data.poster, routeId: data.route.id }
  },
  component: PosterEditor,
})

function PosterEditor() {
  const { poster, routeId } = Route.useLoaderData()
  const router = useRouter()

  return (
    <>
      <a className="crumb" href={`/admin/routes/${routeId}`}>
        ← Back to route
      </a>
      <h1 className="page-title">Edit stop</h1>
      <form
        className="form"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          await api.adminUpdatePoster(poster.id, {
            nameAr: String(form.get('nameAr') ?? ''),
            nameEn: String(form.get('nameEn') ?? ''),
            riddleAr: String(form.get('riddleAr') ?? ''),
            riddleEn: String(form.get('riddleEn') ?? ''),
            active: form.get('active') === 'on',
            lat: String(form.get('lat') ?? ''),
            lng: String(form.get('lng') ?? ''),
          })
          await router.navigate({ to: '/admin/routes/$id', params: { id: String(routeId) } })
        }}
      >
        <label className="field">
          <span className="label">Place name (Arabic)</span>
          <input className="input" name="nameAr" required dir="rtl" defaultValue={poster.nameAr} />
        </label>
        <label className="field">
          <span className="label">Place name (English, optional)</span>
          <input className="input" name="nameEn" defaultValue={poster.nameEn} />
        </label>
        <label className="field">
          <span className="label">Riddle (Arabic)</span>
          <textarea className="input" name="riddleAr" rows={4} required dir="rtl" defaultValue={poster.riddleAr} />
        </label>
        <label className="field">
          <span className="label">Riddle (English, optional)</span>
          <textarea className="input" name="riddleEn" rows={4} defaultValue={poster.riddleEn} />
        </label>
        <div className="grid2">
          <label className="field">
            <span className="label">Latitude</span>
            <input className="input" name="lat" defaultValue={poster.lat ?? ''} />
          </label>
          <label className="field">
            <span className="label">Longitude</span>
            <input className="input" name="lng" defaultValue={poster.lng ?? ''} />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" name="active" defaultChecked={poster.active} /> Active
        </label>
        <p className="dim small">
          Token <code>{poster.token}</code> · manual code <code>{poster.humanCode}</code>
        </p>
        <button className="btn primary big" type="submit">
          Save stop
        </button>
      </form>

      <div className="cta-row">
        <button
          className="btn danger"
          type="button"
          onClick={async () => {
            if (!confirm('Generate a new token? The old printed QR stops working.')) return
            await api.adminRegenerateToken(poster.id)
            await router.invalidate()
          }}
        >
          Regenerate token
        </button>
      </div>
    </>
  )
}
