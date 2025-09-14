// src/main.tsx
import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './translate/i18n'
import { AppThemeProvider } from './theme'   // <-- add this

import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Zaliha from './pages/Zaliha'
import Primke from './pages/Primke'
import Otpremnice from './pages/Otpremnice'
import Inventura from './pages/Inventura'
import Register from './pages/Register'
import { useUserStore } from './store/useUserStore'
import AdminUsers from './pages/AdminPage'
import { useTranslation } from 'react-i18next'

function AdminOnly({ children }: { children: JSX.Element }) {
  const isAdmin = useUserStore(s => s.isAdmin())
  const { t } = useTranslation()
  if (!isAdmin) return <div style={{ padding: 16 }}>{t('errors.forbidden')}</div>
  return children
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <AppThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register/>}/>
            <Route path="/" element={<App />}>
              <Route index element={<Dashboard />} />
              <Route path="zaliha" element={<Zaliha />} />
              <Route path="primke" element={<Primke />} />
              <Route path="otpremnice" element={<Otpremnice />} />
              <Route path="inventura" element={<Inventura />} />
              <Route path="/admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AppThemeProvider>
    </Suspense>
  </React.StrictMode>
)
