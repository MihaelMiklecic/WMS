import * as React from 'react'
import {
  Box, Paper, Stack, Typography, Divider, TextField, Button,
  List, ListItemButton, ListItemText, Avatar, CircularProgress,
} from '@mui/material'
import api from '../../lib/api'
import { useUserStore } from '../../store/useUserStore'
import { getSocket } from './Socket'


const API_BASE = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:4000'
const resolveImg = (u?: string | null) => (!u ? undefined : u.startsWith('http') ? u : `${API_BASE}${u}`)

type ChatUser = { id: number; email: string; role: string; avatarUrl?: string | null }
type Msg = { id: number; fromUserId: number; toUserId: number; body: string; createdAt: string; readAt?: string | null }

export default function ChatPanel() {
  const meId = useUserStore((s) => s.payload?.id)
  const [users, setUsers] = React.useState<ChatUser[]>([])
  const [loadingUsers, setLoadingUsers] = React.useState(false)
  const [active, setActive] = React.useState<ChatUser | null>(null)

  const [msgs, setMsgs] = React.useState<Msg[]>([])
  const [loadingMsgs, setLoadingMsgs] = React.useState(false)
  const [text, setText] = React.useState('')

  React.useEffect(() => {
    let mounted = true
    setLoadingUsers(true)
    api.messages.users()
      .then((rows) => mounted && setUsers(rows))
      .finally(() => mounted && setLoadingUsers(false))
    return () => { mounted = false }
  }, [])

  // connect socket + subscribe to incoming messages
  React.useEffect(() => {
    const sock = getSocket()
    if (!sock) return
    const handler = (m: Msg) => {
      // only append if message belongs to the open conversation
      if (active && ((m.fromUserId === active.id) || (m.toUserId === active.id))) {
        setMsgs((prev) => [...prev, m])
      }
    }
    sock.on('message:new', handler)
    return () => { sock.off('message:new', handler) }
  }, [active])

  async function openUser(u: ChatUser) {
    setActive(u)
    setLoadingMsgs(true)
    try {
      const history = await api.messages.list(u.id)
      setMsgs(history)
      // mark as read
      await api.messages.markRead(u.id)
    } finally {
      setLoadingMsgs(false)
    }
  }

  async function send() {
    if (!active || !text.trim()) return
    const body = text.trim()
    setText('')
    // optimistic append
    const optimistic: Msg = {
      id: Date.now(),
      fromUserId: meId!,
      toUserId: active.id,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
    }
    setMsgs((prev) => [...prev, optimistic])

    try {
      const saved = await api.messages.send(active.id, body)
      // replace optimistic (or just keep both; for simplicity we keep both)
    } catch (e) {
      // rollback optimistic if you like; for now just show an error visually
      console.error(e)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
      <Stack direction="row" sx={{ height: 420 }}>
        {/* Users list */}
        <Box sx={{ width: 280, borderRight: (t) => `1px solid ${t.palette.divider}` }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1">Users</Typography>
          </Box>
          <Divider />
          {loadingUsers ? (
            <Box sx={{ display: 'grid', placeItems: 'center', p: 2 }}><CircularProgress size={20} /></Box>
          ) : (
            <List dense sx={{ py: 0 }}>
              {users.map((u) => (
                <ListItemButton
                  key={u.id}
                  selected={active?.id === u.id}
                  onClick={() => openUser(u)}
                >
                  <Avatar
                    src={resolveImg(u.avatarUrl)}
                    sx={{ width: 28, height: 28, mr: 1 }}
                  >
                    {(u.email || 'U').slice(0, 2).toUpperCase()}
                  </Avatar>
                  <ListItemText primary={u.email} secondary={u.role} />
                </ListItemButton>
              ))}
              {users.length === 0 && <Box sx={{ p: 2, color: 'text.secondary' }}>No users.</Box>}
            </List>
          )}
        </Box>

        {/* Conversation */}
        <Box sx={{ flex: 1, display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1">
              {active ? active.email : 'Select a user'}
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2, overflowY: 'auto' }}>
            {loadingMsgs && <Box sx={{ display: 'grid', placeItems: 'center', py: 3 }}><CircularProgress size={22} /></Box>}
            {!loadingMsgs && active && msgs.map((m) => {
              const mine = m.fromUserId === meId
              return (
                <Box key={`${m.id}-${m.createdAt}`} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1 }}>
                  <Box sx={{
                    maxWidth: '80%',
                    px: 1.25, py: 0.75,
                    borderRadius: 1.5,
                    bgcolor: mine ? 'primary.main' : 'grey.100',
                    color: mine ? 'primary.contrastText' : 'text.primary',
                    boxShadow: 1,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {m.body}
                  </Box>
                </Box>
              )
            })}
            {!loadingMsgs && active && msgs.length === 0 && (
              <Box sx={{ color: 'text.secondary' }}>No messages yet.</Box>
            )}
            {!active && (
              <Box sx={{ color: 'text.secondary' }}>Choose someone to start chatting.</Box>
            )}
          </Box>
          <Divider />
          <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              disabled={!active}
              placeholder={active ? `Message ${active.email}…` : 'Select a user…'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            />
            <Button variant="contained" onClick={send} disabled={!active || !text.trim()}>Send</Button>
          </Box>
        </Box>
      </Stack>
    </Paper>
  )
}
