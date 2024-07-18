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
    const { pieces, piecePokemonMap } = await initializePieces(chess.getBoardState());
    const newGame = new Game({ gameId, fen: chess.getFen(), players, turn: 'w', pieces, piecePokemonMap });

    try {
      await newGame.save();
      console.log(`Game created with players: ${JSON.stringify(players)}`);
      io.to(challenger.id).emit('startGame', { gameId, players, color: 'white', fen: chess.getFen(), pieces, piecePokemonMap });
      io.to(challengee.id).emit('startGame', { gameId, players, color: 'black', fen: chess.getFen(), pieces, piecePokemonMap });
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

  socket.on('move', async ({ gameId, from, to }) => {
    console.log(`Move request received: gameId=${gameId}, from=${from}, to=${to}`);
    try {
      const game = await Game.findOne({ gameId });
      if (game) {
        const chess = new CustomChess();
        chess.load(game.fen);

        const result = chess.move(from, to);

        if (result.valid) {
          const { pieces, piecePokemonMap } = await initializePieces(chess.getBoardState());
          game.fen = chess.getFen();
          game.updated_at = Date.now();
          game.turn = game.turn === 'w' ? 'b' : 'w'; // Switch turn
          game.pieces = pieces;
          game.piecePokemonMap = piecePokemonMap;
          await game.save();

          console.log('Move made:', { from, to, fen: chess.getFen(), turn: game.turn });

          io.to(game.players.white.id).emit('gameState', {
            fen: chess.getBoardState(),
            turn: game.turn,
            move: { from, to },
            pieces: pieces,
            piecePokemonMap: piecePokemonMap // Send the piecePokemonMap
          });
          io.to(game.players.black.id).emit('gameState', {
            fen: chess.getBoardState(),
            turn: game.turn,
            move: { from, to },
            pieces: pieces,
            piecePokemonMap: piecePokemonMap // Send the piecePokemonMap
          });

          if (result.gameOver) {
            io.to(game.players.white.id).emit('gameOver', { winner: result.winner });
            io.to(game.players.black.id).emit('gameOver', { winner: result.winner });
            console.log(`${result.winner} wins by capturing the king`);
          }
        } else {
          console.log('Invalid move:', result.error);
          socket.emit('invalidMove', { error: result.error });
        }
      } else {
        console.log('Game not found for move:', gameId);
        socket.emit('error', { error: 'Game not found' });
      }
    } catch (error) {
      console.error(`Error processing move for gameId=${gameId}:`, error);
      socket.emit('error', { error: 'Failed to process move' });
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
