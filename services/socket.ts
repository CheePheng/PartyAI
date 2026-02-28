import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    socket = io();
  }
  return socket;
};

export const getSocket = () => socket;

export const createRoom = () => {
  if (!socket) initSocket();
  socket?.emit('create_room');
};

export const joinRoom = (roomCode: string, player: any) => {
  if (!socket) initSocket();
  socket?.emit('join_room', { roomCode, player });
};

export const startGame = (roomCode: string, gameId: string) => {
    socket?.emit('start_game', { roomCode, gameId });
};

export const syncPlayers = (roomCode: string, players: any[]) => {
    socket?.emit('sync_players', { roomCode, players });
};

export const updateGameState = (roomCode: string, state: any) => {
    socket?.emit('update_game_state', { roomCode, state });
};

export const sendPlayerAction = (roomCode: string, action: string, payload: any) => {
    socket?.emit('player_action', { roomCode, action, payload });
};
