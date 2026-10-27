import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/noto-sans-arabic/400.css'
import '@fontsource/noto-sans-arabic/500.css'
import '@fontsource/noto-sans-arabic/600.css'
import '@fontsource/noto-sans-arabic/700.css'
import './index.css'
import './i18n'
import App from './App'
import { useLangStore } from './store/useLangStore'
import { applyLanguage } from './i18n'

applyLanguage(useLangStore.getState().lang)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)