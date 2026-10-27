import { useTranslation } from 'react-i18next'
import { RegistrationForm } from './components/RegistrationForm'
import { LanguageSwitcher } from './components/LanguageSwitcher'

function App() {
  const { t } = useTranslation()

  return (
    <main className="bg-animated flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="text-start">
            <h1 className="text-xl font-semibold text-slate-800">{t('title')}</h1>
            <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
          </div>
          <LanguageSwitcher />
        </header>
        <RegistrationForm />
      </div>
    </main>
  )
}

export default App