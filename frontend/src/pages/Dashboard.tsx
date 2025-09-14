// src/pages/Dashboard.tsx
import * as React from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Snackbar,
  Alert,
  Avatar
} from '@mui/material'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import { api } from '../lib/api'
import { useUserStore } from '../store/useUserStore'
import ChatPanel from './components/ChatPanel'
import { useTranslation } from 'react-i18next'

type StockRow = {
  id: number
  quantity: number
  item: { sku: string; name: string }
  location: { code: string }
}

const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:4000'
const resolveImg = (u?: string | null) =>
  !u ? undefined : u.startsWith('http') ? u : `${API_BASE}${u}`

function AvatarEditor() {
  const { t } = useTranslation()
  const payload = useUserStore((s) => s.payload)
  const setPayload = (patch: any) =>
    useUserStore.setState((s) => ({ ...s, payload: { ...(s.payload ?? {}), ...patch } }))

  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = React.useState(false)

  if (!payload?.id) return null // not logged in yet

  const onPick = () => fileRef.current?.click()

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      await api.users.uploadAvatar(payload.id!, file)
      // refresh /auth/me to get the latest avatarUrl from server
      const me = await api.auth.me()
      setPayload(me)
    } catch (err) {
      // optionally surface as toast in parent — keeping silent here
      console.error(err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const initials = ((payload.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase())

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={resolveImg(payload.avatarUrl)}
            alt={payload.email || 'U'}
            sx={{ width: 64, height: 64, fontSize: 20 }}
          >
            {initials}
          </Avatar>
          <Stack>
            <Typography variant="subtitle1">{payload.email}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.role')}: {t(`roles.${payload.role}`)}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onChange}
            style={{ display: 'none' }}
          />
          <Button
            variant="contained"
            startIcon={<PhotoCamera />}
            onClick={onPick}
            disabled={uploading}
          >
            {uploading ? t('dashboard.uploading') : t('dashboard.changeAvatar')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [stock, setStock] = React.useState<StockRow[]>([])
  const [loading, setLoading] = React.useState(false)
  const [toast, setToast] = React.useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>(
    { open: false, msg: '', sev: 'success' }
  )

  React.useEffect(() => {
    load()
  }, [])

  async function load(query?: string) {
    try {
      setLoading(true)
      const data = await api.stock.list(query)
      data.sort((a: StockRow, b: StockRow) =>
        (a.item.sku + a.location.code).localeCompare(b.item.sku + b.location.code)
      )
      setStock(data)
    } catch (e: any) {
      setToast({ open: true, msg: e.message || t('errors.loadStockFailed'), sev: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>{t('dashboard.title')}</Typography>

      <AvatarEditor />
      <ChatPanel />

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.sev} onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
