import { HeadContent, Scripts, createRootRoute, useRouter } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { LangContext, getLang, setLang } from '../lib/lang'
import { dir, t } from '../lib/i18n'

export const Route = createRootRoute({
  loader: () => getLang(),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#0b0c0f' },
      { name: 'color-scheme', content: 'dark' },
      { name: 'robots', content: 'noindex' },
      { title: 'مطاردة الكنز · Treasure Hunt' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/brand/pc-mark-white.svg' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: ({ error }: { error: unknown }) => (
    <div className="result bad">
      <span className="result-mark">!</span>
      <h1>Something broke</h1>
      <p className="hint">{error instanceof Error ? error.message : 'Unexpected error'}</p>
      <a className="btn primary big" href="/">
        Back to the start
      </a>
    </div>
  ),
  notFoundComponent: () => (
    <div className="result bad">
      <span className="result-mark">?</span>
      <h1>Not found</h1>
      <p className="hint">That link is not valid.</p>
      <a className="btn primary big" href="/">
        Back to the start
      </a>
    </div>
  ),
})

function LangToggle({ lang }: { lang: 'ar' | 'en' }) {
  const router = useRouter()
  const next = lang === 'ar' ? 'en' : 'ar'
  return (
    <button
      className="lang"
      type="button"
      aria-label="language"
      onClick={async () => {
        await setLang({ data: next })
        await router.invalidate()
      }}
    >
      {t(lang, 'lang')}
    </button>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const lang = Route.useLoaderData()
  return (
    <html lang={lang} dir={dir(lang)}>
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="glow" aria-hidden="true" />
        <header className="bar">
          <a className="brand" href="/">
            <img src="/brand/pc-lockup-horizontal-dark.svg" alt="Programming Club" height={22} />
          </a>
          <div className="bar-right">
            <LangToggle lang={lang} />
          </div>
        </header>
        <main className="wrap">
          <LangContext.Provider value={lang}>{children}</LangContext.Provider>
        </main>
        <footer className="foot">
          <span>{t(lang, 'appKicker')}</span>
          <span className="dot">·</span>
          <span>2026-27</span>
        </footer>
        <Scripts />
      </body>
    </html>
  )
}
