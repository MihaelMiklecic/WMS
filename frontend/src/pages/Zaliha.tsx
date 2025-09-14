import * as React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  Divider,
  ButtonGroup,
  Toolbar,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:4000";
const resolveImg = (u?: string | null) =>
  !u ? "" : u.startsWith("http") ? u : `${API_BASE}${u}`;

type Item = { id: number; sku: string; name: string; barcode?: string | null };
type ItemWithQty = Item & { totalQty: number; imageUrl?: string | null };

export default function Zaliha() {
  const { t } = useTranslation();

  const [items, setItems] = React.useState<ItemWithQty[]>([]);
  const [toast, setToast] = React.useState<{
    open: boolean;
    sev: "success" | "error";
    msg: string;
  }>({
    open: false,
    sev: "success",
    msg: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [selected, setSelected] = React.useState<number[]>([]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<{
    sku: string;
    name: string;
    barcode: string;
  }>({
    sku: "",
    name: "",
    barcode: "",
  });
  const [file, setFile] = React.useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const rows = await api.items.listWithQty();
      setItems(rows);
    } catch (e: any) {
      setToast({
        open: true,
        sev: "error",
        msg: e.message || t("errors.loadFailed"),
      });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const isSelected = (id: number) => selected.includes(id);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) setSelected(items.map((i) => i.id));
    else setSelected([]);
  };

  const handleRowSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  function onAdd() {
    setEditingId(null);
    setForm({ sku: "", name: "", barcode: "" });
    setFile(null);
    setDialogOpen(true);
  }

  function onEdit() {
    if (selected.length !== 1) return;
    const id = selected[0];
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setForm({ sku: item.sku, name: item.name, barcode: item.barcode ?? "" });
    setFile(null);
    setDialogOpen(true);
  }

  async function onDelete() {
    if (selected.length === 0) return;
    const ok = window.confirm(
      selected.length === 1
        ? t("items.confirm.deleteOne")
        : t("items.confirm.deleteMany", { count: selected.length })
    );
    if (!ok) return;

    try {
      setSaving(true);
      const ids = [...selected];
      await Promise.allSettled(ids.map((id) => api.items.remove(id)));
      setSelected([]);
      await load();
      setToast({ open: true, sev: "success", msg: t("items.toast.deleted") });
    } catch (e: any) {
      setToast({
        open: true,
        sev: "error",
        msg: e?.message || t("errors.deleteFailed"),
      });
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setToast({ open: true, sev: "error", msg: t("items.validation.skuNameRequired") });
      return;
    }
    try {
      setSaving(true);
      let id: number;
      if (editingId == null) {
        const created = await api.items.create({
          sku: form.sku.trim(),
          name: form.name.trim(),
          barcode: form.barcode.trim() || undefined,
        });
        id = created.id;
      } else {
        await api.items.update(editingId, {
          sku: form.sku.trim(),
          name: form.name.trim(),
          barcode: form.barcode.trim() || null,
        });
        id = editingId;
      }

      if (file) {
        await api.items.uploadImage(id, file);
      }

      setToast({
        open: true,
        sev: "success",
        msg: editingId == null ? t("items.toast.created") : t("items.toast.updated"),
      });

      setDialogOpen(false);
      setEditingId(null);
      setForm({ sku: "", name: "", barcode: "" });
      setFile(null);

      await load();
    } catch (e: any) {
      setToast({
        open: true,
        sev: "error",
        msg: e.message || t("errors.saveFailed"),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Typography variant="h4" fontWeight={700}>
        {t("items.title")}
      </Typography>

      <Divider />

      <Paper variant="outlined" sx={{ p: 1 }}>
        <Toolbar
          disableGutters
          sx={{
            px: 1,
            gap: 1,
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ButtonGroup variant="contained" size="small">
              <Button startIcon={<AddIcon />} onClick={onAdd}>
                {t("common.new")}
              </Button>
              <Button
                startIcon={<EditIcon />}
                onClick={onEdit}
                disabled={selected.length !== 1}
              >
                {t("common.edit")}
              </Button>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
                disabled={selected.length === 0}
              >
                {t("common.delete")}
              </Button>
            </ButtonGroup>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t("common.selected", { count: selected.length })}
            </Typography>
            {selected.length > 0 && (
              <Tooltip title={t("common.clearSelection")}>
                <IconButton size="small" onClick={() => setSelected([])}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Toolbar>
      </Paper>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selected.length > 0 && selected.length < items.length
                  }
                  checked={items.length > 0 && selected.length === items.length}
                  onChange={handleSelectAll}
                  inputProps={{ "aria-label": t("items.aria.selectAll") as string }}
                />
              </TableCell>
              <TableCell width={72}>{t("items.columns.image")}</TableCell>
              <TableCell width={80}>{t("items.columns.id")}</TableCell>
              <TableCell>{t("items.columns.sku")}</TableCell>
              <TableCell>{t("items.columns.name")}</TableCell>
              <TableCell>{t("items.columns.barcode")}</TableCell>
              <TableCell align="right">{t("items.columns.totalQty")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((i) => {
              const sel = isSelected(i.id);
              return (
                <TableRow
                  key={i.id}
                  hover
                  selected={sel}
                  onClick={() => handleRowSelect(i.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell
                    padding="checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={sel}
                      onChange={() => handleRowSelect(i.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {i.imageUrl ? (
                      <img
                        src={resolveImg(i.imageUrl)}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                        onError={(e) => {
                          e.currentTarget.src = "";
                          e.currentTarget.alt = "";
                        }}
                      />
                    ) : (
                      <span style={{ color: "#999" }}>—</span>
                    )}
                  </TableCell>

                  <TableCell>{i.id}</TableCell>
                  <TableCell>{i.sku}</TableCell>
                  <TableCell>{i.name}</TableCell>
                  <TableCell>{i.barcode || ""}</TableCell>
                  <TableCell align="right">{i.totalQty}</TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ color: "text.secondary" }}
                >
                  {loading ? t("common.loading") : t("items.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingId == null ? t("items.dialog.newTitle") : t("items.dialog.editTitle")}
        </DialogTitle>
        <Box component="form" onSubmit={onSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2}>
              <TextField
                label={t("items.form.sku")}
                value={form.sku}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sku: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label={t("items.form.name")}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                fullWidth
              />
              <TextField
                label={t("items.form.barcode")}
                value={form.barcode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, barcode: e.target.value }))
                }
                fullWidth
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ marginTop: 8 }}
              />
              {file && (
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {editingId == null ? t("items.actions.add") : t("items.actions.save")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.sev}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
