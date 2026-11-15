import { createContext, useContext } from 'react'
import { createServerFn } from '@tanstack/react-start'
import type { Lang } from './i18n'

export const getLang = createServerFn({ method: 'GET' }).handler(async (): Promise<Lang> => {
  const { getRequestHeaders } = await import('@tanstack/react-start/server')
  const cookie = getRequestHeaders().get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)lang=(ar|en)/)
  return match?.[1] === 'en' ? 'en' : 'ar'
})

export const setLang = createServerFn({ method: 'POST' })
  .validator((lang: Lang) => lang)
  .handler(async ({ data }) => {
    const { setCookie } = await import('@tanstack/react-start/server')
    setCookie('lang', data, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    return data
  })

export const LangContext = createContext<Lang>('ar')
export const useLang = () => useContext(LangContext)
