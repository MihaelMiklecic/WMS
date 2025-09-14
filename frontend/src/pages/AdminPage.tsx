import * as React from 'react'
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, Stack, MenuItem, IconButton, Snackbar, Alert
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { api } from '../lib/api'
import { useUserStore } from '../store/useUserStore'
import { useTranslation } from 'react-i18next'

type UserRow = { id: number; email: string; role: 'admin'|'user'; perms: string[]; createdAt: string }

const ALL_PERMS = [
  'items.edit','locations.edit',
  'receipts.edit','receipts.post',
  'dispatches.edit','dispatches.post',
  'stocktakes.edit','stocktakes.post',
  'user.change.icon'
]

export default function AdminUsers() {
  const { t } = useTranslation()
  const isAdmin = useUserStore(s => s.isAdmin())
  const [rows, setRows] = React.useState<UserRow[]>([])
  const [toast, setToast] = React.useState<{open:boolean; sev:'success'|'error'; msg:string}>({open:false,sev:'success',msg:''})

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<UserRow | null>(null)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [role, setRole] = React.useState<'admin'|'user'>('user')
  const [perms, setPerms] = React.useState<string[]>([])

  React.useEffect(() => {
    api.users.list()
      .then(setRows)
      .catch(e => setToast({open:true, sev:'error', msg: e.message || t('errors.loadFailed')}))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startNew() {
    setEditing(null)
    setEmail('')
    setPassword('')
    setRole('user')
    setPerms([])
    setOpen(true)
  }
  function startEdit(u: UserRow) {
    setEditing(u)
    setEmail(u.email)
    setPassword('')
    setRole(u.role)
    setPerms(u.perms)
    setOpen(true)
  }
  async function onSave() {
    try {
      if (editing) {
        await api.users.update(editing.id, { email, role, perms, ...(password ? {password} : {}) })
        setToast({open:true, sev:'success', msg:t('adminUsers.toast.updated')})
      } else {
        await api.users.create({ email, role, perms, password: password || 'changeme123' })
        setToast({open:true, sev:'success', msg:t('adminUsers.toast.created')})
      }
      const fresh = await api.users.list()
      setRows(fresh)
      setOpen(false)
    } catch (e:any) {
      setToast({open:true, sev:'error', msg:e.message || t('errors.saveFailed')})
    }
  }
  async function onDelete(id:number) {
    if (!confirm(t('adminUsers.confirm.delete'))) return
    try {
      await api.users.remove(id)
      setRows(rows => rows.filter(r => r.id !== id))
      setToast({open:true, sev:'success', msg:t('adminUsers.toast.deleted')})
    } catch (e:any) {
      setToast({open:true, sev:'error', msg:e.message || t('errors.deleteFailed')})
    }
  }

  if (!isAdmin) return <Typography sx={{p:2}}>{t('adminUsers.adminOnly')}</Typography>

  return (
    <Box sx={{ display:'grid', gap:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight={700}>{t('adminUsers.title')}</Typography>
        <Button variant="contained" onClick={startNew}>{t('adminUsers.newUser')}</Button>
      </Stack>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('adminUsers.table.email')}</TableCell>
              <TableCell>{t('adminUsers.table.role')}</TableCell>
              <TableCell>{t('adminUsers.table.perms')}</TableCell>
              <TableCell width={120} align="right">{t('adminUsers.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(u => (
              <TableRow key={u.id} hover>
                <TableCell>{u.email}</TableCell>
                <TableCell>{t(`roles.${u.role}`)}</TableCell>
                <TableCell>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {u.perms.map(p => (
                      <Chip key={p} label={t(`perms.${p}`, { defaultValue: p })} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => startEdit(u)} aria-label={t('common.edit')}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onDelete(u.id)} aria-label={t('common.delete')}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color:'text.secondary' }}>
                  {t('adminUsers.noUsers')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? t('adminUsers.dialog.editTitle') : t('adminUsers.dialog.newTitle')}</DialogTitle>
        <DialogContent sx={{ pt:1 }}>
          <Stack spacing={2}>
            <TextField label={t('adminUsers.form.email')} value={email} onChange={e => setEmail(e.target.value)} fullWidth />
            <TextField
              label={t('adminUsers.form.password')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              type="password"
              placeholder={editing ? t('adminUsers.form.passwordPlaceholder') : ''}
            />
            <TextField select label={t('adminUsers.form.role')} value={role} onChange={e => setRole(e.target.value as any)}>
              <MenuItem value="user">{t('roles.user')}</MenuItem>
              <MenuItem value="admin">{t('roles.admin')}</MenuItem>
            </TextField>
            <TextField
              select
              label={t('adminUsers.form.perms')}
              value={perms}
              onChange={e => setPerms(typeof e.target.value === 'string' ? e.target.value.split(',') : (e.target.value as string[]))}
              SelectProps={{ multiple: true }}
              helperText={t('adminUsers.form.permsHelp')}
            >
              {ALL_PERMS.map(p => (
                <MenuItem key={p} value={p}>{t(`perms.${p}`, { defaultValue: p })}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={onSave} variant="contained">{editing ? t('common.save') : t('adminUsers.dialog.create')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({...t, open:false}))}>
        <Alert severity={toast.sev} onClose={() => setToast(t => ({...t, open:false}))}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
