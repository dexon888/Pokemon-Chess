const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const Chess = require('chess.js').Chess;
const Game = require('./models/Game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

// Connect to MongoDB Atlas
const dbURI = 'mongodb+srv://Wambink:hello@cluster0.stcst1u.mongodb.net/pokemon-chess?retryWrites=true&w=majority';
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create a new game
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

// Get the current game state
app.get('/api/game/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const game = await Game.findOne({ gameId });

  if (game) {
    res.json({ fen: game.fen });
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Make a move
app.post('/api/move/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const { from, to, promotion } = req.body;
  const game = await Game.findOne({ gameId });

  if (game) {
    const chess = new Chess();
    chess.load(game.fen);

    const move = chess.move({ from, to, promotion });

    if (move) {
      let gameOver = null;
      if (chess.isCheckmate()) {
        gameOver = chess.turn() === 'w' ? 'Black wins!' : 'White wins!';
      } else if (chess.isDraw()) {
        gameOver = 'Draw!';
      }

      game.fen = chess.fen();
      game.updated_at = Date.now();
      await game.save();

      res.json({ fen: game.fen, move, gameOver });
    } else {
      res.status(400).json({ error: 'Invalid move' });
    }
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Restart a game
app.post('/api/restart/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const game = await Game.findOne({ gameId });

  if (game) {
    const chess = new Chess();
    game.fen = chess.fen();
    game.updated_at = Date.now();
    await game.save();

    res.json({ fen: game.fen });
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
