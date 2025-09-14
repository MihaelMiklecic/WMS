// src/pages/Login.tsx (i18n)
import * as React from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Avatar, Box, Button, Card, CardContent, CardHeader, CircularProgress, Container,
  Divider, FormControlLabel, Checkbox, IconButton, InputAdornment, Link,
  TextField, Typography, Alert,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { api, setToken, getToken } from '../lib/api'
import { useUserStore } from '../store/useUserStore'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { t } = useTranslation()

  const [email, setEmail] = React.useState('admin@example.com')
  const [password, setPassword] = React.useState('admin123')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const setUserFromToken = useUserStore((s) => s.setUserFromToken)
  const nav = useNavigate()

  React.useEffect(() => {
    const tkn = getToken()
    if (tkn) {
      setUserFromToken(tkn)
      api.auth.me()
        .then((me) => {
          useUserStore.setState((s) => ({
            ...s,
            payload: { ...s.payload, ...me },
          }))
        })
        .catch(() => {})
      nav('/')
    }
  }, [nav, setUserFromToken])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await api.login(email, password)
      setToken(token)
      setUserFromToken(token)
      const me = await api.auth.me()
      useUserStore.setState((s) => ({ ...s, payload: { ...s.payload, ...me } }))
      nav('/')
    } catch (e: any) {
      setError(e?.message ?? t('auth.errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background:
          'radial-gradient(1200px 600px at 10% 10%, rgba(63,81,181,0.08), transparent), radial-gradient(1000px 500px at 90% 90%, rgba(25,118,210,0.08), transparent)',
      }}
    >
      <Container maxWidth="xs">
        <Card elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <LockOutlinedIcon />
              </Avatar>
            }
            title={
              <Typography component="h1" variant="h6" fontWeight={700}>
                {t('auth.login.title')}
              </Typography>
            }
            subheader={t('auth.login.subtitle')}
            sx={{ pb: 0 }}
          />
          <CardContent>
            <Box component="form" onSubmit={onSubmit} noValidate>
              <TextField
                margin="normal"
                fullWidth
                label={t('auth.form.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
              <TextField
                margin="normal"
                fullWidth
                label={t('auth.form.password')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? t('auth.aria.hidePassword') : t('auth.aria.showPassword')}
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <FormControlLabel control={<Checkbox defaultChecked />} label={t('auth.form.rememberMe')} />
              {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
              <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : t('auth.login.cta')}
              </Button>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>{t('auth.login.noAccount')}</Typography>
                <Button component={RouterLink} to="/register" variant="outlined" fullWidth size="large">
                  {t('auth.register.title')}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link component={RouterLink} to="/forgot-password" underline="hover" color="text.secondary">
            {t('auth.login.forgot')}
          </Link>
        </Box>
      </Container>
    </Box>
  )
}
