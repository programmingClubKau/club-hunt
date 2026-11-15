import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/events/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    section: search.section === 'female' ? 'female' : 'male',
  }),
  loader: async ({ location }) => {
    const res = await api.raw('/admin/routes')
    if (res.status === 401) throw redirect({ to: '/admin/login' })
    return { section: (location.search as { section?: string }).section === 'female' ? 'female' : 'male' }
  },
  component: NewEvent,
})

function NewEvent() {
  const { section } = Route.useLoaderData()

  return (
    <>
      <a className="crumb" href="/admin">
        ← All events
      </a>
      <h1 className="page-title">New event</h1>
      <p className="dim">
        An event is a pool of QR codes for one section. Add the QR codes after you create it. Teams pick the event by
        name, then get a random draw from its QR codes.
      </p>
      <form
        className="form"
        method="post"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const res = await api.adminCreateRoute({
            nameAr: String(form.get('nameAr') ?? ''),
            nameEn: String(form.get('nameEn') ?? ''),
            section: (form.get('section') === 'female' ? 'female' : 'male') as 'male' | 'female',
            drawCount: Number(form.get('drawCount') ?? 3),
          })
          if (res.route) window.location.href = `/admin/events/${res.route.id}`
        }}
      >
        <label className="field">
          <span className="label">Event name (Arabic)</span>
          <input className="input" name="nameAr" required dir="rtl" placeholder="مطاردة الكنز" />
        </label>
        <label className="field">
          <span className="label">Event name (English, optional)</span>
          <input className="input" name="nameEn" placeholder="Treasure hunt" />
        </label>
        <fieldset className="seg">
          <label className="seg-item">
            <input type="radio" name="section" value="male" defaultChecked={section === 'male'} />
            <span>Male</span>
          </label>
          <label className="seg-item">
            <input type="radio" name="section" value="female" defaultChecked={section === 'female'} />
            <span>Female</span>
          </label>
        </fieldset>
        <label className="field">
          <span className="label">QR codes per team</span>
          <input className="input" type="number" name="drawCount" min={1} max={50} defaultValue={3} />
        </label>
        <p className="dim small">
          Each team draws this many QR codes at random from the event pool, in random order, so every team walks a
          different path. You can add as many QR codes as you want.
        </p>
        <button className="btn primary big" type="submit">
          Create event
        </button>
      </form>
    </>
  )
}
