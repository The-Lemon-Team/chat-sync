import { io, Socket } from 'socket.io-client';
import type { Message, SyncProgress } from '@/types';

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${WS_BASE}/chat`, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
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
