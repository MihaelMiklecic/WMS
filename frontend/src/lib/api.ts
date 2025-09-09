const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export function getToken() {
  return localStorage.getItem('token')
}
export function setToken(t: string) {
  localStorage.setItem('token', t)
}
export function logout() {
  localStorage.removeItem('token')
}

async function req(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: any = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { ...options, headers })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg)
  }
  return res.json()
}

export const api = {
  login: (email: string, password: string) => req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  items: {
    list: () => req('/api/items'),
    create: (data: any) => req('/api/items', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => req(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => req(`/api/items/${id}`, { method: 'DELETE' }),
  },
  locations: {
    list: () => req('/api/locations'),
    create: (data: any) => req('/api/locations', { method: 'POST', body: JSON.stringify(data) }),
  },
  stock: {
    list: (q?: string) => req(`/api/stock${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  },
  receipts: {
    list: () => req('/api/receipts'),
    create: (data: any) => req('/api/receipts', { method: 'POST', body: JSON.stringify(data) }),
    post: (id: number) => req(`/api/receipts/${id}/post`, { method: 'POST' }),
  },
  dispatches: {
    list: () => req('/api/dispatches'),
    create: (data: any) => req('/api/dispatches', { method: 'POST', body: JSON.stringify(data) }),
    post: (id: number) => req(`/api/dispatches/${id}/post`, { method: 'POST' }),
  },
  stocktakes: {
    list: () => req('/api/stocktakes'),
    create: (data: any) => req('/api/stocktakes', { method: 'POST', body: JSON.stringify(data) }),
    post: (id: number) => req(`/api/stocktakes/${id}/post`, { method: 'POST' }),
  },
}