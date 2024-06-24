const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { Chess } = require('chess.js');
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

const dbURI = 'mongodb+srv://Wambink:hello@cluster0.stcst1u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/api/new-game', async (req, res) => {
  try {
    const { username } = req.body;
    const chess = new Chess();
    const gameId = Date.now().toString();
    const newGame = new Game({
      gameId,
      fen: chess.fen(),
      players: {
        white: { id: null, name: username || '' },
        black: { id: null, name: '' },
      },
    });

    await newGame.save();
    res.status(201).json({ gameId, fen: chess.fen() });
  } catch (error) {
    console.error('Error creating new game:', error);
    res.status(500).json({ error: 'Failed to create new game' });
  }
});

app.post('/api/accept-challenge', async (req, res) => {
  const { challenger, challengee } = req.body;
  const gameId = Date.now().toString();
  const chess = new Chess();
  const players = Math.random() > 0.5 
    ? { white: challenger, black: challengee } 
    : { white: challengee, black: challenger };

  const newGame = new Game({
    gameId,
    fen: chess.fen(),
    players: {
      white: { id: players.white.id, name: players.white.name },
      black: { id: players.black.id, name: players.black.name },
    },
  });

  try {
    await newGame.save();
    io.to(players.white.id).emit('startGame', { gameId, color: 'white' });
    io.to(players.black.id).emit('startGame', { gameId, color: 'black' });
    res.status(201).json({ gameId, players });
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
  console.log('New client connected:', socket.id);

  socket.on('joinLobby', (user) => {
    onlineUsers.push({ id: socket.id, user });
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
      io.to(challenger.id).emit('startGame', { gameId, players, color: 'white' });
      io.to(challengee.id).emit('startGame', { gameId, players, color: 'black' });
      console.log(`Game created with players: ${JSON.stringify(players)}`);
    } catch (err) {
      console.error('Error creating new game:', err);
    }
  });

  socket.on('joinGame', async ({ gameId, username }) => {
    console.log(`joinGame event received with gameId: ${gameId} and username: ${username}`);
  
    try {
      const game = await Game.findOne({ gameId });
      console.log('Game found:', game);
  
      if (game) {
        if (!game.players.white.id) {
          game.players.white.id = socket.id;
          game.players.white.name = username || '';
          await game.save();
          socket.emit('playerColor', 'white');
          console.log(`Assigned white to ${socket.id}`);
        } else if (!game.players.black.id) {
          game.players.black.id = socket.id;
          game.players.black.name = username || '';
          await game.save();
          socket.emit('playerColor', 'black');
          console.log(`Assigned black to ${socket.id}`);
        } else {
          if (socket.id === game.players.white.id) {
            socket.emit('playerColor', 'white');
            console.log(`Confirmed white for ${socket.id}`);
          } else if (socket.id === game.players.black.id) {
            socket.emit('playerColor', 'black');
            console.log(`Confirmed black for ${socket.id}`);
          } else {
            socket.emit('playerColor', 'spectator');
            console.log(`Client ${socket.id} is a spectator`);
          }
        }
      } else {
        console.log(`Game not found for ID: ${gameId}`);
      }
    } catch (error) {
      console.error(`Error finding game with ID: ${gameId}`, error);
    }
  });
  

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    onlineUsers = onlineUsers.filter(user => user.id !== socket.id);
    io.emit('updateLobby', onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

