import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from './features/auth/hooks'
import { hydrate } from './features/auth/authSlice'
import AppRoutes from './routes'
import SessionExpiredModal from './components/SessionExpiredModal'
import TokenRefreshManager from './components/TokenRefreshManager'

function App() {
  const { i18n } = useTranslation()
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(hydrate())
  }, [dispatch])

  useEffect(() => {
    // Set HTML direction based on language
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
  }, [i18n.language])

  return (
    <>
      <AppRoutes />
      <SessionExpiredModal />
      <TokenRefreshManager />
    </>
  )
}

export default App
