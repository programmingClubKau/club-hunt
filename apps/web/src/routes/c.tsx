import { createFileRoute, redirect } from '@tanstack/react-router'
import { useLang } from '../lib/lang'
import { t } from '../lib/i18n'

export const Route = createFileRoute('/c')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === 'string' ? search.code : '',
  }),
  loaderDeps: ({ search }) => ({ code: search.code }),
  loader: async ({ deps }) => {
    if (!deps.code) return { form: true as const }
    throw redirect({ to: '/s/$code', params: { code: deps.code } })
  },
  component: ManualEntry,
})

function ManualEntry() {
  const lang = useLang()
  return (
    <>
      <a className="crumb" href="/h">
        {t(lang, 'back')}
      </a>
      <h1 className="page-title">{t(lang, 'enterCode')}</h1>
      <p className="dim">{t(lang, 'scanHint')}</p>
      <form className="form" method="get" action="/c">
        <label className="field">
          <span className="label">{t(lang, 'code')}</span>
          <input
            className="input code-input"
            type="text"
            name="code"
            maxLength={12}
            autoCapitalize="characters"
            required
            placeholder="------"
          />
        </label>
        <button className="btn primary big" type="submit">
          {t(lang, 'submit')}
        </button>
      </form>
    </>
  )
}
