import * as React from 'react'
import {
  Box, Paper, Stack, Typography, TextField, Button, Divider,
  Autocomplete, Table, TableHead, TableRow, TableCell, TableBody,
  Snackbar, Alert, Chip
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import PostAddIcon from '@mui/icons-material/PostAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import { api } from '../lib/api'

type Item = { id: number; sku: string; name: string }
type Location = { id: number; code: string }
type Receipt = { id: number; number: string; supplier?: string | null; status: string; lines: any[] }

export default function Primke() {
  const [rows, setRows] = React.useState<Receipt[]>([])
  const [number, setNumber] = React.useState('PR-' + Date.now())
  const [supplier, setSupplier] = React.useState('')
  const [items, setItems] = React.useState<Item[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [line, setLine] = React.useState<{ itemId: number | null; locationId: number | null; qty: number }>({ itemId: null, locationId: null, qty: 1 })
  const [lines, setLines] = React.useState<{ itemId: number; locationId: number; qty: number }[]>([])
  const [toast, setToast] = React.useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({ open: false, msg: '', sev: 'success' })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      try {
        const [docs, its, locs] = await Promise.all([api.receipts.list(), api.items.list(), api.locations.list()])
        setRows(docs); setItems(its); setLocations(locs)
      } catch (e: any) {
        setToast({ open: true, sev: 'error', msg: e.message || 'Greška pri učitavanju' })
      }
    })()
  }, [])

  function addLine() {
    if (!line.itemId || !line.locationId) {
      setToast({ open: true, sev: 'error', msg: 'Odaberite artikl i lokaciju' })
      return
    }
    if (line.qty <= 0) {
      setToast({ open: true, sev: 'error', msg: 'Količina mora biti > 0' })
      return
    }
    setLines(prev => [...prev, { itemId: line.itemId!, locationId: line.locationId!, qty: Number(line.qty) }])
    setLine({ itemId: null, locationId: null, qty: 1 })
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  async function create() {
    if (!number.trim()) return setToast({ open: true, sev: 'error', msg: 'Unesite broj primke' })
    if (lines.length === 0) return setToast({ open: true, sev: 'error', msg: 'Dodajte barem jednu stavku' })
    try {
      setSaving(true)
      const doc = await api.receipts.create({ number, supplier, lines })
      setRows(prev => [doc, ...prev])
      setLines([])
      setNumber('PR-' + Date.now())
      setSupplier('')
      setToast({ open: true, sev: 'success', msg: 'Primka spremljena' })
    } catch (e: any) {
      setToast({ open: true, sev: 'error', msg: e.message || 'Greška pri spremanju' })
    } finally {
      setSaving(false)
    }
  }

  async function post(id: number) {
    try {
      await api.receipts.post(id)
      setRows(await api.receipts.list())
      setToast({ open: true, sev: 'success', msg: 'Primka proknjižena' })
    } catch (e: any) {
      setToast({ open: true, sev: 'error', msg: e.message || 'Greška pri knjiženju' })
    }
  }

  const selectedItem = items.find(i => i.id === line.itemId) || null
  const selectedLoc = locations.find(l => l.id === line.locationId) || null

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>Primke</Typography>

      <Paper variant="outlined" sx={{ p: 2, maxWidth: 1000 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Broj primke" value={number} onChange={e => setNumber(e.target.value)} fullWidth />
            <TextField label="Dobavljač" value={supplier} onChange={e => setSupplier(e.target.value)} fullWidth />
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Autocomplete
              options={items}
              getOptionLabel={(o) => `${o.sku} ${o.name}`}
              value={selectedItem}
              onChange={(_, v) => setLine(l => ({ ...l, itemId: v ? v.id : null }))}
              renderInput={(p) => <TextField {...p} label="Artikl" />}
              sx={{ minWidth: 280, flex: 1 }}
            />
            <Autocomplete
              options={locations}
              getOptionLabel={(o) => o.code}
              value={selectedLoc}
              onChange={(_, v) => setLine(l => ({ ...l, locationId: v ? v.id : null }))}
              renderInput={(p) => <TextField {...p} label="Lokacija" />}
              sx={{ minWidth: 220, flex: 1 }}
            />
            <TextField
              type="number"
              label="Količina"
              value={line.qty}
              onChange={e => setLine(l => ({ ...l, qty: Number(e.target.value) }))}
              sx={{ width: 160 }}
              inputProps={{ min: 1 }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={addLine}>
              Dodaj stavku
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ p: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Naziv</TableCell>
                  <TableCell>Lokacija</TableCell>
                  <TableCell align="right">Količina</TableCell>
                  <TableCell align="center">Akcije</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>Nema stavki.</TableCell></TableRow>
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
                            Ukloni
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Paper>

          <Stack direction="row" justifyContent="flex-end">
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={create} disabled={saving}>
              Spremi primku
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Dokumenti</Typography>
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Broj</TableCell>
                <TableCell>Dobavljač</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Stavke</TableCell>
                <TableCell align="center">Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.number}</TableCell>
                  <TableCell>{r.supplier || ''}</TableCell>
                  <TableCell>
                    <Chip label={r.status} color={r.status === 'posted' ? 'success' : 'default'} size="small" variant={r.status === 'posted' ? 'filled' : 'outlined'} />
                  </TableCell>
                  <TableCell align="right">{r.lines.length}</TableCell>
                  <TableCell align="center">
                    {r.status === 'draft' && (
                      <Button size="small" variant="contained" startIcon={<PostAddIcon />} onClick={() => post(r.id)}>
                        Proknjiži
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>Još nema primki.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.sev} onClose={() => setToast(t => ({ ...t, open: false }))}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  )
}
