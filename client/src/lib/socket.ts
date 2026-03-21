import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const url = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const joinHackathon = (hackathonId: string) => {
  getSocket().emit('join:hackathon', hackathonId);
};

export const leaveHackathon = (hackathonId: string) => {
  getSocket().emit('leave:hackathon', hackathonId);
};
