import * as React from 'react'
import { createTheme, ThemeProvider, PaletteMode } from '@mui/material/styles'

type Ctx = {
  mode: PaletteMode
  setMode: (m: PaletteMode) => void
  toggle: () => void
}
export const ColorModeContext = React.createContext<Ctx>({
  mode: 'light',
  setMode: () => {},
  toggle: () => {},
})

export function useColorMode() {
  return React.useContext(ColorModeContext)
}

function buildTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#3f51b5' },       
      secondary: { main: '#00bcd4' },     
      success: { main: '#2e7d32' },
      warning: { main: '#ed6c02' },
      error: { main: '#d32f2f' },
      ...(mode === 'light'
        ? {
            background: { default: '#f7f7fb', paper: '#ffffff' },
          }
        : {
            background: { default: '#0b0f19', paper: '#111827' },
          }),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily:
        '"Inter", system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      fontWeightBold: 700,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 16 },
          contained: { boxShadow: 'none' },
        },
      },
      MuiPaper: { styleOverrides: { root: { borderRadius: 16 } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 20 } } },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#f3f4f6' : '#0f172a',
            '& .MuiTableCell-root': { fontWeight: 700 },
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  })
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<PaletteMode>(() => {
    const stored = localStorage.getItem('mui-mode')
    return (stored as PaletteMode) || 'light'
  })

  const theme = React.useMemo(() => buildTheme(mode), [mode])

  const ctx = React.useMemo<Ctx>(
    () => ({
      mode,
      setMode: (m) => {
        localStorage.setItem('mui-mode', m)
        setMode(m)
      },
      toggle: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light'
          localStorage.setItem('mui-mode', next)
          return next
        })
      },
    }),
    [mode]
  )

  return (
    <ColorModeContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  )
}
