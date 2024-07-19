const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const CustomChess = require('./customChess');
const Game = require('./models/Game');
const { initializePieces } = require('../frontend/src/utils');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
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

let onlineUsers = [];

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinLobby', (user) => {
    onlineUsers.push({ id: socket.id, user });
    console.log('User joined lobby:', user);
    io.emit('updateLobby', onlineUsers);
  });

  socket.on('challengePlayer', ({ challenger, challengee }) => {
    console.log('Player challenged:', { challenger, challengee });
    io.to(challengee.id).emit('receiveChallenge', { challenger });
  });

  socket.on('acceptChallenge', async ({ challenger, challengee }) => {
    console.log('Challenge accepted:', { challenger, challengee });
    const gameId = Date.now().toString();
    const chess = new CustomChess();
    const players = Math.random() > 0.5 ? { white: challenger, black: challengee } : { white: challengee, black: challenger };
    
    // Initialize pieces and piecePokemonMap
    const { pieces, piecePokemonMap } = await initializePieces(chess.getBoardState());

    const newGame = new Game({ gameId, fen: chess.getFen(), players, turn: 'w', pieces, piecePokemonMap });

    try {
      await newGame.save();
      console.log(`Game created with players: ${JSON.stringify(players)}`);
      io.to(challenger.id).emit('startGame', { gameId, players, color: players.white.id === challenger.id ? 'white' : 'black', fen: chess.getFen(), pieces, piecePokemonMap });
      io.to(challengee.id).emit('startGame', { gameId, players, color: players.white.id === challengee.id ? 'white' : 'black', fen: chess.getFen(), pieces, piecePokemonMap });
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
        const isPlayerWhite = game.players.white.id === socket.id;
        const isPlayerBlack = game.players.black.id === socket.id;

        if (!isPlayerWhite && !isPlayerBlack) {
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
            socket.emit('playerColor', 'spectator');
            console.log(`Client ${socket.id} is a spectator`);
          }
        } else {
          const color = isPlayerWhite ? 'white' : 'black';
          socket.emit('playerColor', color);
          console.log(`Confirmed ${color} for ${socket.id}`);
        }

        console.log('Emitting gameState event with:', {
          fen: game.fen,
          turn: game.turn,
          pieces: game.pieces,
          piecePokemonMap: game.piecePokemonMap
        });

        socket.emit('gameState', {
          fen: game.fen,
          turn: game.turn,
          pieces: game.pieces,
          piecePokemonMap: game.piecePokemonMap
        });
      } else {
        console.log(`Game not found for ID: ${gameId}`);
      }
    } catch (error) {
      console.error(`Error finding game with ID: ${gameId}`, error);
    }
  });

  app.post('/api/move/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const { from, to } = req.body;

  console.log(`Move request received: gameId=${gameId}, from=${from}, to=${to}`);
  try {
    const game = await Game.findOne({ gameId });
    if (game) {
      const chess = new CustomChess();
      chess.load(game.fen);

      const result = chess.move(from, to);

      if (result.valid) {
        game.fen = chess.getFen();
        game.updated_at = Date.now();
        game.turn = game.turn === 'w' ? 'b' : 'w'; // Switch turn

        // Update pieces based on new board state without reinitializing
        const updatedPieces = new Map(game.pieces); // Ensure proper Map type
        const fromKey = `${from[0]}${from[1]}`;
        const toKey = `${to[0]}${to[1]}`;
        updatedPieces.set(toKey, updatedPieces.get(fromKey));
        updatedPieces.delete(fromKey);

        game.pieces = updatedPieces;

        await game.save();

        console.log('Move made:', { from, to, fen: chess.getFen(), turn: game.turn });

        io.to(game.players.white.id).emit('gameState', {
          fen: chess.getBoardState(),
          turn: game.turn,
          move: { from, to },
          pieces: Object.fromEntries(game.pieces), // Convert map to object for transmission
          piecePokemonMap: Object.fromEntries(game.piecePokemonMap) // Convert map to object for transmission
        });
        io.to(game.players.black.id).emit('gameState', {
          fen: chess.getBoardState(),
          turn: game.turn,
          move: { from, to },
          pieces: Object.fromEntries(game.pieces), // Convert map to object for transmission
          piecePokemonMap: Object.fromEntries(game.piecePokemonMap) // Convert map to object for transmission
        });

        if (result.gameOver) {
          io.to(game.players.white.id).emit('gameOver', { winner: result.winner });
          io.to(game.players.black.id).emit('gameOver', { winner: result.winner });
          console.log(`${result.winner} wins by capturing the king`);
        }

        return res.status(200).json({
          pieces: Object.fromEntries(game.pieces), // Convert map to object for transmission
          piecePokemonMap: Object.fromEntries(game.piecePokemonMap), // Convert map to object for transmission
          turn: game.turn,
          gameOver: result.gameOver,
          winner: result.winner
        });
      } else {
        console.log('Invalid move:', result.error);
        return res.status(400).json({ error: result.error });
      }
    } else {
      console.log('Game not found for move:', gameId);
      return res.status(404).json({ error: 'Game not found' });
    }
  } catch (error) {
    console.error(`Error processing move for gameId=${gameId}:`, error);
    return res.status(500).json({ error: 'Failed to process move' });
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
