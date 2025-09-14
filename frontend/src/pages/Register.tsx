import * as React from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Avatar, Box, Button, Card, CardContent, CardHeader, CircularProgress, Container,
  Divider, IconButton, InputAdornment, Link, TextField, Typography, Alert,
} from '@mui/material'
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { api, setToken } from '../lib/api'
import { useUserStore } from '../store/useUserStore'
import { useTranslation } from 'react-i18next'

export default function Register() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const setUserFromToken = useUserStore(s => s.setUserFromToken)

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess('')
    setLoading(true)
    try {
      await api.auth.register(email, password)
      const { token } = await api.auth.login(email, password)
      setToken(token)
      setUserFromToken(token)
      setSuccess(t('auth.register.success'))
      nav('/')
    } catch (e: any) {
      setError(e?.message ?? t('auth.register.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Container maxWidth="xs">
        <Card elevation={6} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <CardHeader
            avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><PersonAddAlt1Icon /></Avatar>}
            title={<Typography component="h1" variant="h6" fontWeight={700}>{t('auth.register.title')}</Typography>}
            subheader={t('auth.register.subtitle')}
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
                autoComplete="new-password"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(s => !s)} edge="end" aria-label="toggle password">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : t('auth.register.cta')}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t('auth.register.haveAccount')}
                </Typography>
                <Button component={RouterLink} to="/login" variant="outlined" fullWidth size="large">
                  {t('auth.login.title')}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link component={RouterLink} to="/login" underline="hover" color="text.secondary">
            {t('auth.register.backToLogin')}
          </Link>
        </Box>
      </Container>
    </Box>
  )
}
