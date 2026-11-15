import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../lib/api'
import { useLang } from '../lib/lang'
import { pick, stopsCount, t } from '../lib/i18n'

export const Route = createFileRoute('/t/$section')({
  loader: async ({ params }) => {
    const section = params.section === 'female' ? 'female' : params.section === 'male' ? 'male' : null
    if (!section) throw redirect({ to: '/' })
    const res = await api.events(section)
    return { section, events: res.events ?? [] }
  },
  component: EventPicker,
})

function EventPicker() {
  const lang = useLang()
  const { section, events } = Route.useLoaderData()
  const sectionKey = section === 'female' ? 'female' : 'male'

  return (
    <>
      <a className="crumb" href="/">
        {t(lang, 'back')}
      </a>
      <span className="kicker">{t(lang, sectionKey)}</span>
      <h1 className="page-title">{t(lang, 'chooseEvent')}</h1>

      {events.length === 0 ? (
        <p className="empty">{t(lang, 'noEvents')}</p>
      ) : (
        <div className="list">
          {events.map((event) => (
            <a className="card section-card" key={event.id} href={`/start/${event.id}`}>
              <strong>{pick(lang, event.nameAr, event.nameEn)}</strong>
              <span className="dim small">
                {stopsCount(lang, event.stops)} · {t(lang, 'drawShort').replace('{n}', String(event.drawCount))}
              </span>
              <span className="card-go">{lang === 'ar' ? '←' : '→'}</span>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
