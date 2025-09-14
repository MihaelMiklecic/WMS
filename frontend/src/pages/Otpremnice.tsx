import * as React from 'react'
import {
  Box, Paper, Stack, Typography, TextField, Button, Divider,
  Autocomplete, Table, TableHead, TableRow, TableCell, TableBody,
  Snackbar, Alert, Chip, ButtonGroup, Toolbar, Checkbox, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SaveIcon from '@mui/icons-material/Save'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'

// --- Types ---
type Item = { id: number; sku: string; name: string }
type Location = { id: number; code: string }
type DispatchLine = { itemId: number; locationId: number; qty: number }
type Dispatch = { id: number; number: string; customer?: string | null; status: 'draft' | 'posted' | string; lines: DispatchLine[] }

export default function Otpremnice() {
  const { t } = useTranslation()
  // data
  const [rows, setRows] = React.useState<Dispatch[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // toast
  const [toast, setToast] = React.useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>(
    { open: false, msg: '', sev: 'success' }
  )

  // selection
  const [selected, setSelected] = React.useState<number[]>([])
  const isSelected = (id: number) => selected.includes(id)
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelected(rows.map(r => r.id))
    else setSelected([])
  }
  const handleRowSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // dialog (create/edit)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [number, setNumber] = React.useState('OT-' + Date.now())
  const [customer, setCustomer] = React.useState('')
  const [line, setLine] = React.useState<{ itemId: number | null; locationId: number | null; qty: number }>({ itemId: null, locationId: null, qty: 1 })
  const [lines, setLines] = React.useState<DispatchLine[]>([])

  // init
  React.useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [docs, its, locs] = await Promise.all([
          api.dispatches.list(),
          api.items.list(),
          api.locations.list(),
        ])
        setRows(docs)
        setItems(its)
        setLocations(locs)
      } catch (e: any) {
        setToast({ open: true, sev: 'error', msg: e?.message || t('errors.loadFailed') })
      } finally {
        setLoading(false)
      }
    })()
  }, [t])

  // helpers
  const selectedItem = items.find(i => i.id === line.itemId) || null
  const selectedLoc = locations.find(l => l.id === line.locationId) || null

  // line ops (inside dialog)
  function addLine() {
    if (!line.itemId || !line.locationId) {
      setToast({ open: true, sev: 'error', msg: t('validation.chooseItemLocation') })
      return
    }
    if (line.qty <= 0) {
      setToast({ open: true, sev: 'error', msg: t('validation.qtyPositive') })
      return
    }
    setLines(prev => [...prev, { itemId: line.itemId!, locationId: line.locationId!, qty: Number(line.qty) }])
    setLine({ itemId: null, locationId: null, qty: 1 })
  }
  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  // toolbar actions
  function onNew() {
    setEditingId(null)
    setNumber('OT-' + Date.now())
    setCustomer('')
    setLines([])
    setLine({ itemId: null, locationId: null, qty: 1 })
    setDialogOpen(true)
  }

  function onEdit() {
    if (selected.length !== 1) return
    const r = rows.find(x => x.id === selected[0])
    if (!r) return
    if (r.status !== 'draft') {
      setToast({ open: true, sev: 'error', msg: t('dispatches.onlyDraftEditable') })
      return
    }
    setEditingId(r.id)
    setNumber(r.number)
    setCustomer(r.customer || '')
    setLines(r.lines ?? [])
    setLine({ itemId: null, locationId: null, qty: 1 })
    setDialogOpen(true)
  }

  async function onDelete() {
    if (selected.length === 0) return
    const affected = rows.filter(r => selected.includes(r.id))
    const postedCount = affected.filter(r => r.status === 'posted').length
    if (postedCount > 0) {
      const proceed = window.confirm(t('dispatches.confirm.deletePostedWarning', { count: postedCount }))
      if (!proceed) return
    }
    const ok = window.confirm(selected.length === 1 ? t('dispatches.confirm.deleteOne') : t('dispatches.confirm.deleteMany', { count: selected.length }))
    if (!ok) return

    try {
      setSaving(true)
      const ids = [...selected]
      const results = await Promise.allSettled(ids.map(id => (api.dispatches as any).delete(id)))
      const succeeded = ids.filter((_, i) => results[i].status === 'fulfilled')
      const failed = results.filter(r => r.status === 'rejected').length

      if (succeeded.length) {
        setRows(prev => prev.filter(r => !succeeded.includes(r.id)))
        setSelected([])
      }
      if (failed) {
        setToast({ open: true, sev: 'error', msg: t('errors.deleteSomeFailed', { count: failed }) })
      } else {
        setToast({ open: true, sev: 'success', msg: t('dispatches.toast.deleted') })
      }
    } catch (e: any) {
      setToast({ open: true, sev: 'error', msg: e?.message || t('errors.deleteFailed') })
    } finally {
      setSaving(false)
    }
  }

  // create/update submit from dialog
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!number.trim()) return setToast({ open: true, sev: 'error', msg: t('dispatches.enterNumber') })
    if (lines.length === 0) return setToast({ open: true, sev: 'error', msg: t('dispatches.atLeastOneLine') })

    try {
      setSaving(true)
      if (editingId == null) {
        const doc = await api.dispatches.create({ number, customer, lines })
        setRows(prev => [doc, ...prev])
        setToast({ open: true, sev: 'success', msg: t('dispatches.saved') })
      } else {
        const updated = await (api.dispatches as any).update(editingId, { number, customer, lines })
        setRows(prev => prev.map(r => (r.id === editingId ? updated : r)))
        setToast({ open: true, sev: 'success', msg: t('dispatches.updated') })
      }
      setDialogOpen(false)
      setEditingId(null)
    } catch (e: any) {
      setToast({ open: true, sev: 'error', msg: e?.message || t('errors.saveFailed') })
    } finally {
      setSaving(false)
    }
  }

  // post existing
  async function post(id: number) {
    try {
      await api.dispatches.post(id)
      setRows(await api.dispatches.list())
      setToast({ open: true, sev: 'success', msg: t('dispatches.posted') })
      setSelected(prev => prev.filter(x => x !== id))
    } catch (e: any) {
      setToast({ open: true, sev: 'error', msg: e?.message || t('errors.postFailed') })
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>{t('dispatches.title')}</Typography>

      {/* Toolbar above documents table */}
      <Paper variant="outlined" sx={{ p: 1 }}>
        <Toolbar disableGutters sx={{ px: 1, gap: 1, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <ButtonGroup variant="contained" size="small">
            <Button startIcon={<AddIcon />} onClick={onNew}>{t('common.new')}</Button>
            <Button startIcon={<EditIcon />} onClick={onEdit} disabled={selected.length !== 1}>{t('common.edit')}</Button>
            <Button startIcon={<DeleteIcon />} color="error" onClick={onDelete} disabled={selected.length === 0}>{t('common.delete')}</Button>
          </ButtonGroup>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('common.selected', { count: selected.length })}</Typography>
            {selected.length > 0 && (
              <Tooltip title={t('common.clearSelection')}>
                <IconButton size="small" onClick={() => setSelected([])}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Toolbar>
      </Paper>

      {/* Documents table */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>{t('common.documents')}</Typography>
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < rows.length}
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': t('dispatches.aria.selectAll') as string }}
                  />
                </TableCell>
                <TableCell>{t('common.number')}</TableCell>
                <TableCell>{t('dispatches.customer')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell align="right">{t('common.lines')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => {
                const sel = isSelected(r.id)
                return (
                  <TableRow
                    key={r.id}
                    hover
                    selected={sel}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleRowSelect(r.id)}
                  >
                    <TableCell padding="checkbox" onClick={(e) => { e.stopPropagation(); handleRowSelect(r.id) }}>
                      <Checkbox checked={sel} />
                    </TableCell>
                    <TableCell>{r.number}</TableCell>
                    <TableCell>{r.customer || ''}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(`status.${r.status}`, { defaultValue: r.status })}
                        color={r.status === 'posted' ? 'success' : 'default'}
                        size="small"
                        variant={r.status === 'posted' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">{r.lines?.length ?? 0}</TableCell>
                    <TableCell align="center">
                      {r.status === 'draft' && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PostAddIcon />}
                          onClick={(e) => { e.stopPropagation(); post(r.id) }}
                        >
                          {t('common.post')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                    {loading ? t('common.loading') : t('dispatches.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId == null ? t('dispatches.dialog.newTitle') : t('dispatches.dialog.editTitle')}</DialogTitle>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label={t('dispatches.form.number')} value={number} onChange={e => setNumber(e.target.value)} fullWidth />
                <TextField label={t('dispatches.form.customer')} value={customer} onChange={e => setCustomer(e.target.value)} fullWidth />
              </Stack>

              <Divider />

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Autocomplete
                  options={items}
                  getOptionLabel={(o) => `${o.sku} ${o.name}`}
                  value={selectedItem}
                  onChange={(_, v) => setLine(l => ({ ...l, itemId: v ? v.id : null }))}
                  renderInput={(p) => <TextField {...p} label={t('dispatches.form.item')} />}
                  sx={{ minWidth: 280, flex: 1 }}
                />
                <Autocomplete
                  options={locations}
                  getOptionLabel={(o) => o.code}
                  value={selectedLoc}
                  onChange={(_, v) => setLine(l => ({ ...l, locationId: v ? v.id : null }))}
                  renderInput={(p) => <TextField {...p} label={t('dispatches.form.location')} />}
                  sx={{ minWidth: 220, flex: 1 }}
                />
                <TextField
                  type="number"
                  label={t('dispatches.form.qty')}
                  value={line.qty}
                  onChange={e => setLine(l => ({ ...l, qty: Number(e.target.value) }))}
                  sx={{ width: 160 }}
                  inputProps={{ min: 1 }}
                />
                <Button variant="contained" startIcon={<AddIcon />} onClick={addLine}>
                  {t('common.addLine')}
                </Button>
              </Stack>

              <Paper variant="outlined" sx={{ p: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>{t('common.name')}</TableCell>
                      <TableCell>{t('common.location')}</TableCell>
                      <TableCell align="right">{t('common.quantity')}</TableCell>
                      <TableCell align="center">{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                          {t('common.noLines')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((ln, idx) => {
                        const i = items.find(x => x.id === ln.itemId)
                        const l = locations.find(x => x.id === ln.locationId)
                        return (
                          <TableRow key={idx}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{i?.sku}</TableCell>
                            <TableCell>{i?.name}</TableCell>
                            <TableCell>{l?.code}</TableCell>
                            <TableCell align="right">{ln.qty}</TableCell>
                            <TableCell align="center">
                              <Button color="error" size="small" startIcon={<DeleteIcon />} onClick={() => removeLine(idx)}>
                                {t('common.remove')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving}>
              {editingId == null ? t('dispatches.actions.save') : t('dispatches.actions.saveChanges')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.sev} onClose={() => setToast(t => ({ ...t, open: false }))}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
