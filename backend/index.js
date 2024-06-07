const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Chess = require('chess.js').Chess;
const Game = require('./models/Game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  },
});

app.use(cors({ origin: 'http://localhost:3000', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Route for creating a new game
app.post('/api/new-game', async (req, res) => {
  try {
    const chess = new Chess();
    const gameId = Date.now().toString();
    const newGame = new Game({ gameId, fen: chess.fen() });
    
    await newGame.save();
    res.status(201).json({ gameId, fen: chess.fen() });
  } catch (error) {
    console.error('Error creating new game:', error);
    res.status(500).json({ error: 'Failed to create new game' });
  }
});

// Connect to MongoDB Atlas
const dbURI = 'mongodb+srv://Wambink:hello@cluster0.stcst1u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

let onlineUsers = [];

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle new player joining the lobby
  socket.on('joinLobby', (user) => {
    onlineUsers.push({ id: socket.id, user });
    io.emit('updateLobby', onlineUsers);
  });

  // Handle player challenging another player
  socket.on('challengePlayer', ({ challenger, challengee }) => {
    io.to(challengee.id).emit('receiveChallenge', { challenger });
  });

  // Handle player accepting a challenge
  socket.on('acceptChallenge', ({ challenger, challengee }) => {
    const gameId = Date.now().toString();
    const chess = new Chess();
    const players = Math.random() > 0.5 ? { white: challenger, black: challengee } : { white: challengee, black: challenger };
    const newGame = new Game({ gameId, fen: chess.fen(), players });

    newGame.save().then(() => {
      io.to(challenger.id).emit('startGame', { gameId, players });
      io.to(challengee.id).emit('startGame', { gameId, players });
    }).catch((err) => {
      console.error('Error creating new game:', err);
    });
  });

  // Handle game moves
  socket.on('makeMove', async ({ gameId, from, to, promotion }) => {
    const game = await Game.findOne({ gameId });

    if (game) {
      const chess = new Chess();
      chess.load(game.fen);

      try {
        const move = chess.move({ from, to, promotion });
        if (move) {
          game.fen = chess.fen();
          game.updated_at = Date.now();
          await game.save();

          io.to(game.players.white.id).emit('gameState', game.fen);
          io.to(game.players.black.id).emit('gameState', game.fen);

          if (chess.isCheckmate()) {
            io.to(game.players.white.id).emit('gameOver', chess.turn() === 'w' ? 'Black wins!' : 'White wins!');
            io.to(game.players.black.id).emit('gameOver', chess.turn() === 'w' ? 'Black wins!' : 'White wins!');
          } else if (chess.isStalemate()) {
            io.to(game.players.white.id).emit('gameOver', 'Draw!');
            io.to(game.players.black.id).emit('gameOver', 'Draw!');
          }
        } else {
          socket.emit('invalidMove', 'Invalid move');
        }
      } catch (error) {
        console.error(`Invalid move from ${from} to ${to}:`, error);
        socket.emit('invalidMove', 'Invalid move');
      }
    }
  });

  // Handle player disconnecting
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    onlineUsers = onlineUsers.filter(user => user.id !== socket.id);
    io.emit('updateLobby', onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
