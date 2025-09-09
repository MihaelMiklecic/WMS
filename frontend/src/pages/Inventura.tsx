import * as React from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Divider,
  Autocomplete,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import PostAddIcon from '@mui/icons-material/PostAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import { api } from '../lib/api'

type Item = { id: number; sku: string; name: string }
type Location = { id: number; code: string }
type Stocktake = { id: number; number: string; status: string; lines: any[] }

export default function Inventura() {
  const [rows, setRows] = React.useState<Stocktake[]>([])
  const [number, setNumber] = React.useState<string>('IN-' + Date.now())
  const [items, setItems] = React.useState<Item[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [line, setLine] = React.useState<{ itemId: number | null; locationId: number | null; countedQty: number }>({
    itemId: null,
    locationId: null,
    countedQty: 0,
  })
  const [lines, setLines] = React.useState<{ itemId: number; locationId: number; countedQty: number }[]>([])
  const [toast, setToast] = React.useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({ open: false, msg: '', sev: 'success' })

  React.useEffect(() => {
    ;(async () => {
      try {
        const [st, its, locs] = await Promise.all([
          api.stocktakes.list(),
          api.items.list(),
          api.locations.list(),
        ])
        setRows(st)
        setItems(its)
        setLocations(locs)
      } catch (e: any) {
        setToast({ open: true, msg: e.message || 'Greška pri učitavanju', sev: 'error' })
      }
    })()
  }, [])

  function resetLine() {
    setLine({ itemId: null, locationId: null, countedQty: 0 })
  }

  function addLine() {
    if (!line.itemId || !line.locationId) {
      setToast({ open: true, msg: 'Odaberite artikl i lokaciju', sev: 'error' })
      return
    }
    if (line.countedQty < 0) {
      setToast({ open: true, msg: 'Količina ne može biti negativna', sev: 'error' })
      return
    }
    setLines(prev => [...prev, { itemId: line.itemId!, locationId: line.locationId!, countedQty: Number(line.countedQty) }])
    resetLine()
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  async function create() {
    if (!number.trim()) {
      setToast({ open: true, msg: 'Unesite broj inventure', sev: 'error' })
      return
    }
    if (lines.length === 0) {
      setToast({ open: true, msg: 'Dodajte barem jednu stavku', sev: 'error' })
      return
    }
    try {
      const doc = await api.stocktakes.create({ number, lines })
      setRows(prev => [doc, ...prev])
      setLines([])
      setNumber('IN-' + Date.now())
      setToast({ open: true, msg: 'Inventura spremljena', sev: 'success' })
    } catch (e: any) {
      setToast({ open: true, msg: e.message || 'Greška pri spremanju', sev: 'error' })
    }
  }

  async function post(id: number) {
    try {
      await api.stocktakes.post(id)
      setRows(await api.stocktakes.list())
      setToast({ open: true, msg: 'Inventura proknjižena', sev: 'success' })
    } catch (e: any) {
      setToast({ open: true, msg: e.message || 'Greška pri knjiženju', sev: 'error' })
    }
  }

  const selectedItem = items.find(i => i.id === line.itemId) || null
  const selectedLoc = locations.find(l => l.id === line.locationId) || null

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>Inventura</Typography>

      {/* Entry card */}
      <Paper variant="outlined" sx={{ p: 2, maxWidth: 1000 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Broj inventure"
              value={number}
              onChange={e => setNumber(e.target.value)}
              fullWidth
            />
          </Stack>

          <Divider />

          {/* Line builder */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Autocomplete
              options={items}
              getOptionLabel={(o) => `${o.sku} ${o.name}`}
              value={selectedItem}
              onChange={(_, val) => setLine(l => ({ ...l, itemId: val ? val.id : null }))}
              renderInput={(params) => <TextField {...params} label="Artikl" />}
              sx={{ minWidth: 280, flex: 1 }}
            />
            <Autocomplete
              options={locations}
              getOptionLabel={(o) => o.code}
              value={selectedLoc}
              onChange={(_, val) => setLine(l => ({ ...l, locationId: val ? val.id : null }))}
              renderInput={(params) => <TextField {...params} label="Lokacija" />}
              sx={{ minWidth: 220, flex: 1 }}
            />
            <TextField
              type="number"
              label="Broj komada"
              value={line.countedQty}
              onChange={e => setLine(l => ({ ...l, countedQty: Number(e.target.value) }))}
              sx={{ width: 160 }}
              inputProps={{ min: 0 }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={addLine}>
              Dodaj stavku
            </Button>
          </Stack>

          {/* Lines table */}
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
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                      Nema stavki – dodajte stavku iznad.
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
                        <TableCell align="right">{ln.countedQty}</TableCell>
                        <TableCell align="center">
                          <IconButton aria-label="Obriši" onClick={() => removeLine(idx)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Paper>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={create}>
              Spremi inventuru
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Existing documents */}
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Dokumenti</Typography>
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Broj</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Stavke</TableCell>
                <TableCell align="center">Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.number}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.status}
                      color={r.status === 'posted' ? 'success' : 'default'}
                      size="small"
                      variant={r.status === 'posted' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="right">{r.lines.length}</TableCell>
                  <TableCell align="center">
                    {r.status !== 'posted' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<PostAddIcon />}
                        onClick={() => post(r.id)}
                      >
                        Proknjiži
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                    Još nema inventura.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>

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
