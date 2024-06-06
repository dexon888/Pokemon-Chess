// backend/index.js
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
    credentials: true
  },
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Connect to MongoDB Atlas
const dbURI = 'mongodb+srv://Wambink:hello@cluster0.stcst1u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define your API routes
app.post('/api/new-game', async (req, res) => {
  const gameId = Date.now().toString();
  const chess = new Chess();
  const newGame = new Game({ gameId, fen: chess.fen() });

  try {
    await newGame.save();
    res.json({ gameId, fen: newGame.fen });
  } catch (error) {
    console.error('Error creating new game:', error);
    res.status(500).json({ error: 'Error creating new game' });
  }
});

app.get('/api/game/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const game = await Game.findOne({ gameId });

  if (game) {
    res.json({ fen: game.fen });
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinGame', async ({ gameId }) => {
    socket.join(gameId);
    const game = await Game.findOne({ gameId });

    if (game) {
      socket.emit('gameState', game.fen);
    }
  });

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

          io.to(gameId).emit('gameState', game.fen);

          if (chess.isCheckmate()) {
            io.to(gameId).emit('gameOver', chess.turn() === 'w' ? 'Black wins!' : 'White wins!');
          } else if (chess.isStalemate()) {
            io.to(gameId).emit('gameOver', 'Draw!');
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

  socket.on('restartGame', async ({ gameId }) => {
    const game = await Game.findOne({ gameId });

    if (game) {
      const chess = new Chess();
      game.fen = chess.fen();
      game.updated_at = Date.now();
      await game.save();

      io.to(gameId).emit('gameState', game.fen);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
