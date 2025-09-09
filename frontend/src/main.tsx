import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Zaliha from './pages/Zaliha'
import Primke from './pages/Primke'
import Otpremnice from './pages/Otpremnice'
import Inventura from './pages/Inventura'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="zaliha" element={<Zaliha />} />
          <Route path="primke" element={<Primke />} />
          <Route path="otpremnice" element={<Otpremnice />} />
          <Route path="inventura" element={<Inventura />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)