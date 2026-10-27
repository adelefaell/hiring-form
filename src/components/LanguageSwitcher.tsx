import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useLangStore } from '../store/useLangStore'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const nextLang = lang === 'ar' ? 'en' : 'ar'

  return (
    <button
      type="button"
      onClick={() => setLang(nextLang)}
      aria-label={t('lang.switch')}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <Globe className="size-4" aria-hidden="true" />
      {nextLang === 'ar' ? 'العربية' : 'English'}
    </button>
  )
}