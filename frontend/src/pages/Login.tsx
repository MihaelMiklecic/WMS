import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setToken, getToken } from '../lib/api'
export default function Login() {
  const [email, setEmail] = React.useState('admin@example.com')
  const [password, setPassword] = React.useState('admin123')
  const [error, setError] = React.useState<string | null>(null)
  const nav = useNavigate()
  React.useEffect(() => { if (getToken()) nav('/') }, [nav])
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try { const { token } = await api.login(email, password); setToken(token); nav('/') } catch (e: any) { setError(e.message) }
  }
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <form onSubmit={onSubmit} style={{ border: '1px solid #ddd', padding: 24, borderRadius: 8, minWidth: 320 }}>
        <h2>Prijava</h2>
        <div><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} style={{ width:'100%' }} /></div>
        <div><label>Lozinka</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{ width:'100%' }} /></div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ marginTop: 12 }}>Login</button>
      </form>
    </div>
  )
}