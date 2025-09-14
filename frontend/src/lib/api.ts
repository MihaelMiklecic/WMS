const API =
  (import.meta as any)?.env?.VITE_API_URL?.toString?.() || 'http://localhost:4000';

export function getToken() {
  return localStorage.getItem('token');
}
export function setToken(t: string) {
  localStorage.setItem('token', t);
}
export function logout() {
  localStorage.removeItem('token');
}

async function parseResponse(res: Response) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function req(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await parseResponse(res);
    const msg =
      (body && typeof body === 'object' && 'error' in body && (body as any).error) ||
      (typeof body === 'string' ? body : res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return parseResponse(res);
}

async function reqForm(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST') {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, {
    method,
    body: formData,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await parseResponse(res);
    const msg =
      (body && typeof body === 'object' && 'error' in body && (body as any).error) ||
      (typeof body === 'string' ? body : res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return parseResponse(res);
}

const auth = {
  login: (email: string, password: string) =>
    req('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string) =>
    req('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => req('/auth/me'),
}


const users = {
  list: () => req('/api/users'),
  create: (data: { email: string; password?: string; role: 'admin' | 'user'; perms: string[] }) =>
    req('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (
    id: number,
    data: Partial<{ email: string; password: string; role: 'admin' | 'user'; perms: string[] }>
  ) => req(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => req(`/api/users/${id}`, { method: 'DELETE' }),
  uploadAvatar: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return reqForm(`/api/users/${id}/avatar`, fd, 'POST');
  },
};

const items = {
  list: () => req('/api/items'),
  listWithQty: (q?: string) => req(`/api/items/with-qty${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  create: (data: any) => req('/api/items', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => req(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => req(`/api/items/${id}`, { method: 'DELETE' }),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return reqForm(`/api/items/${id}/image`, fd, 'POST');
  },
};

const locations = {
  list: () => req('/api/locations'),
  create: (data: any) => req('/api/locations', { method: 'POST', body: JSON.stringify(data) }),
};

const stock = {
  list: (q?: string) => req(`/api/stock${q ? `?q=${encodeURIComponent(q)}` : ''}`),
};

const receipts = {
  list: () => req('/api/receipts'),
  create: (data: any) => req('/api/receipts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => req(`/api/receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => req(`/api/receipts/${id}`, { method: 'DELETE' }),
  post: (id: number) => req(`/api/receipts/${id}/post`, { method: 'POST' }),
};

const dispatches = {
  list: () => req('/api/dispatches'),
  create: (data: any) => req('/api/dispatches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => req(`/api/dispatches/${id}`, { method: 'PUT', body: JSON.stringify(data) }), // <—
  post: (id: number) => req(`/api/dispatches/${id}/post`, { method: 'POST' }),
  delete: (id: number) => req(`/api/dispatches/${id}`, { method: 'DELETE' }),
};

const stocktakes = {
  list: () => req('/api/stocktakes'),
  create: (data: any) => req('/api/stocktakes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => req(`/api/stocktakes/${id}`, { method: 'PUT', body: JSON.stringify(data) }), // <—
  delete: (id: number) => req(`/api/stocktakes/${id}`, { method: 'DELETE' }), // <—
  post: (id: number) => req(`/api/stocktakes/${id}/post`, { method: 'POST' }),
};

const messages = {
  users: () => req('/api/messages/users'),
  list: (userId: number) => req(`/api/messages?userId=${userId}`),
  send: (toUserId: number, body: string) =>
    req('/api/messages', { method: 'POST', body: JSON.stringify({ toUserId, body }) }),
  markRead: (userId: number) =>
    req('/api/messages/read', { method: 'POST', body: JSON.stringify({ userId }) }),
};




export const api = {
  auth,
  users,
  login: auth.login,

  items,
  locations,
  stock,

  receipts,
  dispatches,
  stocktakes,
  messages,
};

export default api;
