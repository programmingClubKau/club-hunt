import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../lib/api'
import { useLang } from '../lib/lang'
import { t } from '../lib/i18n'

export const Route = createFileRoute('/t/$section')({
  loader: async ({ params }) => {
    const section = params.section === 'female' ? 'female' : params.section === 'male' ? 'male' : null
    if (!section) throw redirect({ to: '/' })
    const res = await api.assign(section)
    if (!res.routeId) return { none: true as const, section }
    throw redirect({
      to: '/start/$routeId',
      params: { routeId: String(res.routeId) },
    })
  },
  component: NoRoute,
})

function NoRoute() {
  const lang = useLang()
  const data = Route.useLoaderData() as { none: true; section: 'male' | 'female' }
  return (
    <>
      <a className="crumb" href="/">
        {t(lang, 'back')}
      </a>
      <h1 className="page-title">{t(lang, data.section)}</h1>
      <p className="empty">{t(lang, 'noRoutes')}</p>
    </>
  )
}
