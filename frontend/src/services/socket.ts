import { io, Socket } from 'socket.io-client';
import { getStoredToken } from '@/api/client';
import type { Message, SyncProgress } from '@/types';

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getStoredToken();
    socket = io(`${WS_BASE}/chat`, {
      transports: ['websocket'],
      autoConnect: !!token,
      auth: token ? { token } : undefined,
    });
  }
  return socket;
}

export function connectSocket() {
  const token = getStoredToken();
  if (!token) return;

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return;
  }

  getSocket();
}

export function joinForkRoom(chatForkId: string) {
  getSocket().emit('join', chatForkId);
}

export function leaveForkRoom(chatForkId: string) {
  getSocket().emit('leave', chatForkId);
}

export function onNewMessage(handler: (message: Message) => void) {
  getSocket().on('message:new', handler);
  return () => getSocket().off('message:new', handler);
}

export function onSyncProgress(handler: (progress: SyncProgress) => void) {
  getSocket().on('sync:progress', handler);
  return () => getSocket().off('sync:progress', handler);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
