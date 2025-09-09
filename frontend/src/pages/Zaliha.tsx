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
  Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { api } from '../lib/api'

type Item = { id: number; sku: string; name: string; barcode?: string | null }

export default function Zaliha() {
  const [items, setItems] = React.useState<Item[]>([])
  const [sku, setSku] = React.useState('')
  const [name, setName] = React.useState('')
  const [barcode, setBarcode] = React.useState('')
  const [toast, setToast] = React.useState<{ open: boolean; sev: 'success' | 'error'; msg: string }>({
    open: false,
    sev: 'success',
    msg: '',
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    api.items.list().then(setItems).catch((e: any) =>
      setToast({ open: true, sev: 'error', msg: e.message || 'Greška pri učitavanju artikala' })
    )
  }, [])

  async function addItem() {
    if (!sku.trim() || !name.trim()) {
      setToast({ open: true, sev: 'error', msg: 'SKU i Naziv su obavezni' })
      return
    }
    try {
      setSaving(true)
      const item = await api.items.create({ sku: sku.trim(), name: name.trim(), barcode: barcode.trim() || undefined })
      setItems(prev => [item, ...prev])
      setSku(''); setName(''); setBarcode('')
      setToast({ open: true, sev: 'success', msg: 'Artikl dodan' })
    } catch (e: any) {
      setToast({ open: true, sev: 'error', msg: e.message || 'Greška pri spremanju' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>Zaliha (Artikli)</Typography>

      {/* Add item card */}
      <Paper variant="outlined" sx={{ p: 2, maxWidth: 900 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Dodaj artikl</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Naziv"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Barkod"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addItem}
              disabled={saving}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Dodaj
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Divider />

      {/* Items table */}
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={80}>ID</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Naziv</TableCell>
              <TableCell>Barkod</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.id}</TableCell>
                <TableCell>{i.sku}</TableCell>
                <TableCell>{i.name}</TableCell>
                <TableCell>{i.barcode || ''}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                  Nema artikala.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
