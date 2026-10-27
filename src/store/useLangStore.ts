import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { applyLanguage, type Lang } from '../i18n'

interface LangState {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'ar',
      setLang: (lang) => {
        set({ lang })
        applyLanguage(lang)
      },
    }),
    { name: 'hdtc-lang' },
  ),
)