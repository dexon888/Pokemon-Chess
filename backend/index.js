const Chess = require('chess.js').Chess;
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
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

// Connect to MongoDB Atlas
const dbURI = 'mongodb+srv://Wambink:hello@cluster0.stcst1u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/api/new-game', async (req, res) => {
  try {
    const chess = new Chess();
    const gameId = Date.now().toString();
    const newGame = new Game({
      gameId,
      fen: chess.fen(),
      players: {
        white: { id: null },
        black: { id: null },
      },
    });

    await newGame.save();
    res.status(201).json({ gameId, fen: chess.fen() });
  } catch (error) {
    console.error('Error creating new game:', error);
    res.status(500).json({ error: 'Failed to create new game' });
  }
});

app.post('/api/move/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const { from, to, promotion, playerColor } = req.body;
  const game = await Game.findOne({ gameId });

  console.log(`Move received for game ${gameId} from ${from} to ${to} by ${playerColor}`);

  if (game) {
    const chess = new Chess();
    chess.load(game.fen);

    if ((playerColor === 'white' && chess.turn() !== 'w') || (playerColor === 'black' && chess.turn() !== 'b')) {
      console.log('Not your turn');
      return res.status(400).json({ error: 'Not your turn' });
    }

    try {
      const move = chess.move({ from, to, promotion });
      if (move) {
        game.fen = chess.fen();
        game.updated_at = Date.now();
        await game.save();

        io.to(game.players.white.id).emit('gameState', game.fen);
        io.to(game.players.black.id).emit('gameState', game.fen);

        console.log(`Move successful: ${from} to ${to}`);
        res.json({ fen: game.fen, move });
      } else {
        console.log('Invalid move');
        res.status(400).json({ error: 'Invalid move' });
      }
    } catch (error) {
      console.error(`Invalid move from ${from} to ${to}:`, error);
      res.status(400).json({ error: 'Invalid move' });
    }
  } else {
    console.log('Game not found');
    res.status(404).json({ error: 'Game not found' });
  }
});

let onlineUsers = [];

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on('joinLobby', (user) => {
    onlineUsers.push({ id: socket.id, user });
    console.log(`User ${user.name} joined the lobby with socket ID: ${socket.id}`);
    io.emit('updateLobby', onlineUsers);
  });

  socket.on('challengePlayer', ({ challenger, challengee }) => {
    io.to(challengee.id).emit('receiveChallenge', { challenger });
  });

  socket.on('acceptChallenge', async ({ challenger, challengee }) => {
    const gameId = Date.now().toString();
    const chess = new Chess();
    const players = Math.random() > 0.5 ? { white: challenger, black: challengee } : { white: challengee, black: challenger };
    const newGame = new Game({ gameId, fen: chess.fen(), players });

    try {
      await newGame.save();
      io.to(challenger.id).emit('startGame', { gameId, players });
      io.to(challengee.id).emit('startGame', { gameId, players });
      console.log(`Game created with players: ${JSON.stringify(players)}`);
    } catch (err) {
      console.error('Error creating new game:', err);
    }
  });

  socket.on('joinGame', async ({ gameId }) => {
    const game = await Game.findOne({ gameId });
    console.log(`Client ${socket.id} joining game ${gameId}`);
  
    if (game) {
      console.log(`Current game players: ${JSON.stringify(game.players)}`);
      if (!game.players.white.id) {
        game.players.white.id = socket.id;
        await game.save();
        socket.emit('playerColor', 'white');
        console.log(`Assigned white to ${socket.id} for game ${gameId}`);
      } else if (!game.players.black.id) {
        game.players.black.id = socket.id;
        await game.save();
        socket.emit('playerColor', 'black');
        console.log(`Assigned black to ${socket.id} for game ${gameId}`);
      } else {
        console.log(`Game ${gameId} is full. ${socket.id} cannot join.`);
        socket.emit('gameFull', { gameId });
      }
    } else {
      console.log(`Game not found for ID: ${gameId}`);
    }
  });
  

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    onlineUsers = onlineUsers.filter(user => user.id !== socket.id);
    io.emit('updateLobby', onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
