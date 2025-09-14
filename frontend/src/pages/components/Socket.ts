import { io, Socket } from "socket.io-client";
import { getToken } from "../../lib/api";

let socket: Socket | null = null;

export function getSocket() {
  const token = getToken();
  if (!socket) {
    socket = io(
      (import.meta as any)?.env?.VITE_API_URL || "http://localhost:4000",
      {
        withCredentials: true,
        auth: { token },
        autoConnect: !!token,
      }
    );
  } else {
    if (token && !socket.connected) {
      socket.auth = { token };
      socket.connect();
    }
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
