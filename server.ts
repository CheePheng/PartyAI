import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Game State Management
  interface RoomState {
    players: any[];
    activeGame: string | null;
    gameState: any;
    hostId: string;
  }

  const rooms: Record<string, RoomState> = {};

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create_room', (hostData) => {
      const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      rooms[roomCode] = {
        players: [],
        activeGame: null,
        gameState: {},
        hostId: socket.id
      };
      socket.join(roomCode);
      socket.emit('room_created', roomCode);
      console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    socket.on('join_room', ({ roomCode, player }) => {
      const room = rooms[roomCode];
      if (room) {
        // Check if player name exists, maybe append number or just allow
        const existingPlayer = room.players.find(p => p.id === player.id);
        if (!existingPlayer) {
            room.players.push({ ...player, socketId: socket.id });
        } else {
            // Reconnect logic if needed
            existingPlayer.socketId = socket.id;
        }
        
        socket.join(roomCode);
        io.to(roomCode).emit('update_players', room.players);
        
        // Send current game state to new player
        if (room.activeGame) {
            socket.emit('game_started', room.activeGame);
            socket.emit('update_game_state', room.gameState);
        }
        
        console.log(`Player ${player.name} joined room ${roomCode}`);
      } else {
        socket.emit('error', 'Room not found');
      }
    });

    socket.on('start_game', ({ roomCode, gameId }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].activeGame = gameId;
        io.to(roomCode).emit('game_started', gameId);
      }
    });

    socket.on('sync_players', ({ roomCode, players }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].players = players;
        io.to(roomCode).emit('update_players', players);
      }
    });

    socket.on('update_game_state', ({ roomCode, state }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].gameState = state;
        // Broadcast to everyone in room except sender (usually host)
        socket.to(roomCode).emit('update_game_state', state);
      }
    });

    socket.on('player_action', ({ roomCode, action, payload }) => {
      // Forward player action to host
      const room = rooms[roomCode];
      if (room) {
        io.to(room.hostId).emit('player_action', { playerId: socket.id, action, payload });
      }
    });

    socket.on('disconnect', () => {
      // Handle disconnect
      // In a real app, we might remove player or mark as offline
      // For now, simple cleanup if host leaves?
      // Or just let it be.
      console.log('Client disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
