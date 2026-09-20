import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadJson, saveJson } from '../lib/storage'
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES,
  translate,
  type Locale,
} from './translations'

const STORAGE_KEY = 'dff_locale'

interface I18nState {
  locale: Locale
  dir: 'ltr' | 'rtl'
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  locales: typeof LOCALES
}

const I18nContext = createContext<I18nState | null>(null)

function readStoredLocale(): Locale {
  const raw = loadJson<unknown>(STORAGE_KEY, DEFAULT_LOCALE)
  return isLocale(raw) ? raw : DEFAULT_LOCALE
}

function applyDocumentLocale(locale: Locale) {
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = locale
  document.documentElement.dir = dir
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const initial = typeof document !== 'undefined' ? readStoredLocale() : DEFAULT_LOCALE
    if (typeof document !== 'undefined') applyDocumentLocale(initial)
    return initial
  })

  useEffect(() => {
    applyDocumentLocale(locale)
    saveJson(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo<I18nState>(
    () => ({
      locale,
      dir: locale === 'ar' ? 'rtl' : 'ltr',
      setLocale,
      t,
      locales: LOCALES,
    }),
    [locale, setLocale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
