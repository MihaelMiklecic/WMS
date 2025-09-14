import * as React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Button,
  useMediaQuery,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory2";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import LogoutIcon from "@mui/icons-material/Logout";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getToken, logout } from "./lib/api";
import { useUserStore } from "./store/useUserStore";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { useTranslation } from "react-i18next";
import { useColorMode } from "./theme";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:4000";
const resolveImg = (u?: string | null) =>
  !u ? undefined : u.startsWith("http") ? u : `${API_BASE}${u}`;

const drawerWidth = 240;

type MenuItemDef = {
  labelKey: string;
  to: string;
  icon: React.ReactElement;
  requireAdmin?: boolean;
};

const MENU: MenuItemDef[] = [
  { labelKey: "nav.dashboard", to: "/", icon: <DashboardIcon /> },
  { labelKey: "nav.items", to: "/zaliha", icon: <InventoryIcon /> },
  { labelKey: "nav.receipts", to: "/primke", icon: <AssignmentTurnedInIcon /> },
  {
    labelKey: "nav.dispatches",
    to: "/otpremnice",
    icon: <LocalShippingIcon />,
  },
  { labelKey: "nav.stocktakes", to: "/inventura", icon: <FactCheckIcon /> },
  {
    labelKey: "nav.admin",
    to: "/admin/users",
    icon: <ManageAccountsIcon />,
    requireAdmin: true,
  },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const payload = useUserStore((s) => s.payload);

  const { mode, toggle } = useColorMode();

  const [open, setOpen] = React.useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const settingsOpen = Boolean(settingsAnchorEl);

  // language dialog state
  const [langDialogOpen, setLangDialogOpen] = React.useState(false);
  const [lang, setLang] = React.useState<"hr" | "en">(
    i18n.language?.startsWith("hr") ? "hr" : "en"
  );

  React.useEffect(() => {
    if (!getToken()) nav("/login");
  }, [nav]);

  function handleLogout() {
    logout();
    nav("/login");
  }

  function handleOpenSettingsMenu(e: React.MouseEvent<HTMLElement>) {
    setSettingsAnchorEl(e.currentTarget);
  }
  function handleCloseSettingsMenu() {
    setSettingsAnchorEl(null);
  }

  function openLanguageDialog() {
    setLang(i18n.language?.startsWith("hr") ? "hr" : "en");
    setLangDialogOpen(true);
  }
  function closeLanguageDialog() {
    setLangDialogOpen(false);
  }
  function saveLanguage() {
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
    setLangDialogOpen(false);
  }

  const userName = payload?.email ?? "";
  const userInitials = userName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarUrl = payload?.avatarUrl;
  const isAdmin = useUserStore((s) => s.isAdmin());
  const visibleMenu = MENU.filter((m) => !m.requireAdmin || isAdmin);

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {t("app.brand")}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={userName}>
            <Avatar
              alt={userName}
              src={resolveImg(avatarUrl)}
              sx={{
                bgcolor: "primary.main",
                width: 36,
                height: 36,
                fontSize: 14,
              }}
            >
              {!avatarUrl && userInitials}
            </Avatar>
          </Tooltip>

          <Tooltip title={t("app.settings")}>
            <IconButton
              aria-label={t("app.settings")}
              onClick={handleOpenSettingsMenu}
              size="small"
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={settingsAnchorEl}
            open={settingsOpen}
            onClose={handleCloseSettingsMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                handleCloseSettingsMenu();
                nav("/profile");
                if (!isDesktop) setOpen(false);
              }}
            >
              {t("app.profile")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseSettingsMenu();
                openLanguageDialog(); 
                if (!isDesktop) setOpen(false);
              }}
            >
              {t("app.settings")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                toggle();
              }}
            >
              {mode === "light" ? (
                <DarkModeIcon fontSize="small" style={{ marginRight: 8 }} />
              ) : (
                <LightModeIcon fontSize="small" style={{ marginRight: 8 }} />
              )}
              {t("app.theme")}:{" "}
              {t(mode === "light" ? "app.themeLight" : "app.themeDark")}
            </MenuItem>

            <Divider />
            <MenuItem
              onClick={() => {
                handleCloseSettingsMenu();
                handleLogout();
              }}
            >
              <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
              {t("app.logout")}
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flex: 1 }}>
        {visibleMenu.map((m) => (
          <ListItemButton
            key={m.to}
            component={NavLink}
            to={m.to}
            sx={{
              '&.active, &[aria-current="page"]': {
                bgcolor: "action.selected",
              },
            }}
            onClick={() => !isDesktop && setOpen(false)}
          >
            <ListItemIcon>{m.icon}</ListItemIcon>
            <ListItemText primary={t(m.labelKey)} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          {t("app.logout")}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          zIndex: (tM) => tM.zIndex.drawer + 1,
          transition: (tM) => tM.transitions.create(["margin", "width"]),
          ...(isDesktop &&
            open && {
              width: `calc(100% - ${drawerWidth}px)`,
              ml: `${drawerWidth}px`,
            }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen((v) => !v)}
            sx={{ mr: 2 }}
            aria-label={t("app.openMenu")}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {t("app.title")}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {isDesktop && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
              <Tooltip title={userName}>
                <Avatar
                  alt={userName}
                  src={resolveImg(avatarUrl)}
                  sx={{
                    bgcolor: "primary.main",
                    width: 36,
                    height: 36,
                    fontSize: 14,
                  }}
                >
                  {!avatarUrl && userInitials}
                </Avatar>
              </Tooltip>
              <Tooltip title={t("app.settings")}>
                <IconButton
                  aria-label={t("app.settings")}
                  onClick={handleOpenSettingsMenu}
                  size="small"
                  color="inherit"
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          variant="persistent"
          anchor="left"
          open={open}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          anchor="left"
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: "100%",
          transition: (tM) => tM.transitions.create("margin"),
          mt: "64px",
          ...(isDesktop && open ? { ml: `${drawerWidth}px` } : { ml: 0 }),
          bgcolor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Outlet />
      </Box>

      <Dialog open={langDialogOpen} onClose={closeLanguageDialog}>
        <DialogTitle>{t("app.languageDialogTitle")}</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={lang}
            onChange={(e) => setLang(e.target.value as "hr" | "en")}
          >
            <FormControlLabel
              value="hr"
              control={<Radio />}
              label={t("app.hr")}
            />
            <FormControlLabel
              value="en"
              control={<Radio />}
              label={t("app.en")}
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLanguageDialog}>{t("common.cancel")}</Button>
          <Button onClick={saveLanguage} variant="contained">
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
