import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../lib/api'

export const Route = createFileRoute('/admin/routes/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    section: search.section === 'female' ? 'female' : 'male',
  }),
  loader: async ({ location }) => {
    const res = await api.raw('/admin/routes')
    if (res.status === 401) throw redirect({ to: '/admin/login' })
    return { section: (location.search as { section?: string }).section === 'female' ? 'female' : 'male' }
  },
  component: NewRoute,
})

function NewRoute() {
  const { section } = Route.useLoaderData()

  return (
    <>
      <a className="crumb" href="/admin">
        ← All routes
      </a>
      <h1 className="page-title">New route</h1>
      <form
        className="form"
        method="post"
        action="/admin/routes/create"
        onSubmit={async (event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const res = await api.adminCreateRoute({
            nameAr: String(form.get('nameAr') ?? ''),
            nameEn: String(form.get('nameEn') ?? ''),
            section: (form.get('section') === 'female' ? 'female' : 'male') as 'male' | 'female',
            drawCount: Number(form.get('drawCount') ?? 3),
          })
          if (res.route) window.location.href = `/admin/routes/${res.route.id}`
        }}
      >
        <label className="field">
          <span className="label">Name (Arabic)</span>
          <input className="input" name="nameAr" required dir="rtl" placeholder="مسار المكتبة" />
        </label>
        <label className="field">
          <span className="label">Name (English, optional)</span>
          <input className="input" name="nameEn" placeholder="Library trail" />
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
          <span className="label">Spots per team</span>
          <input className="input" type="number" name="drawCount" min={1} max={50} defaultValue={3} />
        </label>
        <p className="dim small">
          Stops are drawn at random from the trail pool for every team, so two teams on the same trail walk different
          paths. A pool of 12 with 3 per team gives 220 combinations.
        </p>
        <button className="btn primary big" type="submit">
          Create route
        </button>
      </form>
    </>
  )
}
