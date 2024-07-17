const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const CustomChess = require('./customChess');
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
    const chess = new CustomChess();
    const gameId = Date.now().toString();
    const newGame = new Game({
      gameId,
      fen: chess.getFen(),
      board: chess.getBoardState(),
      players: {
        white: { id: null, name: username || '' },
        black: { id: null, name: '' },
      },
    });

    await newGame.save();
    res.status(201).json({ gameId, fen: chess.getFen(), board: chess.getBoardState() });
  } catch (error) {
    console.error('Error creating new game:', error);
    res.status(500).json({ error: 'Failed to create new game' });
  }
});

app.post('/api/move/:gameId', async (req, res) => {
  const gameId = req.params.gameId;
  const { from, to } = req.body;  // Remove playerColor

  const game = await Game.findOne({ gameId });

  console.log(`Move received for game ${gameId} from ${from} to ${to}`);

  if (game) {
    const chess = new CustomChess();
    chess.load(game.fen);  // Use load to load the FEN

    const result = chess.move(from, to);

    if (result.valid) {
      game.fen = chess.getFen();
      game.updated_at = Date.now();
      await game.save();

      io.to(game.players.white.id).emit('gameState', { fen: chess.getBoardState(), turn: chess.getTurn(), move: { from, to } });
      io.to(game.players.black.id).emit('gameState', { fen: chess.getBoardState(), turn: chess.getTurn(), move: { from, to } });

      if (result.gameOver) {
        io.to(game.players.white.id).emit('gameOver', { winner: result.winner });
        io.to(game.players.black.id).emit('gameOver', { winner: result.winner });
        console.log(`${result.winner} wins by capturing the king`);
      }

      res.json({ fen: chess.getBoardState(), move: { from, to }, gameOver: result.gameOver });
    } else {
      console.log('Invalid move');
      res.status(400).json({ error: result.error });
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
    const chess = new CustomChess();
    const players = Math.random() > 0.5 ? { white: challenger, black: challengee } : { white: challengee, black: challenger };
    const newGame = new Game({ gameId, fen: chess.getFen(), players });  // Save FEN string directly

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

  socket.on('testEvent', (data) => {
    console.log('Test event received:', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    onlineUsers = onlineUsers.filter(user => user.id !== socket.id);
    io.emit('updateLobby', onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

