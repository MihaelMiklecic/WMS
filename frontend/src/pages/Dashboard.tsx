import * as React from 'react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import { api } from '../lib/api'

type StockRow = {
  id: number
  quantity: number
  item: { sku: string; name: string }
  location: { code: string }
}

export default function Dashboard() {
  const [stock, setStock] = React.useState<StockRow[]>([])
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [toast, setToast] = React.useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({ open: false, msg: '', sev: 'success' })

  React.useEffect(() => {
    load()
  }, [])

  async function load(query?: string) {
    try {
      setLoading(true)
      const data = await api.stock.list(query)
      // Optional: simple client-side sort by SKU then location
      data.sort((a: StockRow, b: StockRow) => (a.item.sku + a.location.code).localeCompare(b.item.sku + b.location.code))
      setStock(data)
    } catch (e: any) {
      setToast({ open: true, msg: e.message || 'Greška pri učitavanju zaliha', sev: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function search() {
    await load(q.trim() || undefined)
  }

  // Enter to search
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') search()
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>Dashboard</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            fullWidth
            placeholder="Traži po SKU / Naziv / Barkod"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={search} startIcon={<SearchIcon />}>
              Traži
            </Button>
            <Button variant="outlined" onClick={() => { setQ(''); load() }} startIcon={<RefreshIcon />}>
              Osvježi
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Divider />

      <Paper variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 0 }}>
          <Typography variant="subtitle1">Rezultati</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Učitavanje…' : `Ukupno: ${stock.length}`}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'grid', placeItems: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Naziv</TableCell>
                <TableCell>Lokacija</TableCell>
                <TableCell align="right">Količina</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stock.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.item.sku}</TableCell>
                  <TableCell>{s.item.name}</TableCell>
                  <TableCell>{s.location.code}</TableCell>
                  <TableCell align="right">{s.quantity}</TableCell>
                </TableRow>
              ))}
              {stock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                    Nema rezultata.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

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
