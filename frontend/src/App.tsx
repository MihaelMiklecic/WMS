import * as React from 'react'
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
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import InventoryIcon from '@mui/icons-material/Inventory2'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import LogoutIcon from '@mui/icons-material/Logout'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { getToken, logout } from './lib/api'

const drawerWidth = 240

type MenuItem = { label: string; to: string; icon: React.ReactElement }
const menu: MenuItem[] = [
  { label: 'Dashboard',  to: '/',           icon: <DashboardIcon /> },
  { label: 'Zaliha',     to: '/zaliha',     icon: <InventoryIcon /> },
  { label: 'Primke',     to: '/primke',     icon: <AssignmentTurnedInIcon /> },
  { label: 'Otpremnice', to: '/otpremnice', icon: <LocalShippingIcon /> },
  { label: 'Inventura',  to: '/inventura',  icon: <FactCheckIcon /> },
]

export default function App() {
  const nav = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'))

  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!getToken()) nav('/login')
  }, [nav])

  function handleLogout() {
    logout()
    nav('/login')
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700}>WMS</Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1 }}>
        {menu.map(m => (
          <ListItemButton
            key={m.to}
            component={NavLink}
            to={m.to}/* 
            className={({ isActive }) => (isActive ? 'active' : undefined)} */
            sx={{
              '&.active, &[aria-current="page"]': { bgcolor: 'action.selected' },
            }}
            onClick={() => !isDesktop && setOpen(false)}
          >
            <ListItemIcon>{m.icon}</ListItemIcon>
            <ListItemText primary={m.label} />
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
          Odjava
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* Top bar with toggle */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
          transition: theme => theme.transitions.create(['margin', 'width']),
          ...(isDesktop && open && {
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setOpen(v => !v)}
            sx={{ mr: 2 }}
            aria-label="open menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Smart Warehouse
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer:
          - Desktop: persistent (pushes content right when open)
          - Mobile: temporary (slides over)
      */}
      {isDesktop ? (
        <Drawer
          variant="persistent"
          anchor="left"
          open={open}
          sx={{
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
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
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content shifts right only on desktop when drawer is open */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          transition: theme => theme.transitions.create('margin'),
          mt: '64px', // AppBar height offset
          ...(isDesktop && open ? { ml: `${drawerWidth}px` } : { ml: 0 }),
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
