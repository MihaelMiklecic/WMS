import { create } from 'zustand'

export type JwtPayload = {
  id?: number
  email?: string
  role?: 'admin' | 'user'
  perms?: string[]
  avatarUrl?: string | null    
  iat?: number
  exp?: number
  [key: string]: unknown
}


type UserState = {
  token: string | null
  payload: JwtPayload | null
  setUserFromToken: (token: string) => void
  clear: () => void
  hasPerm: (perm: string) => boolean
  isAdmin: () => boolean
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload = ''] = token.split('.')
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '==='.slice((base64.length + 3) % 4)
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const useUserStore = create<UserState>((set, get) => ({
  token: null,
  payload: null,
  setUserFromToken: (token: string) => {
    const payload = decodeJwtPayload(token)
    set({ token, payload })
  },
  clear: () => set({ token: null, payload: null }),
  hasPerm: (perm: string) => {
    const p = get().payload
    if (!p) return false
    if (p.role === 'admin') return true
    return Array.isArray(p.perms) ? p.perms.includes(perm) : false
  },
  isAdmin: () => get().payload?.role === 'admin',
}))
