const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const CustomChess = require('./customChess');
const Game = require('./models/Game');
const axios = require('axios');
const { initializePieces } = require('./utils');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CORS_ORIGIN, methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

let onlineUsers = [];

// Type effectiveness functions
const typeEffectiveness = {
  normal: { superEffective: [], notVeryEffective: ['rock', 'steel'], immune: ['ghost'] },
  fire: { superEffective: ['grass', 'ice', 'bug', 'steel'], notVeryEffective: ['fire', 'water', 'rock', 'dragon'], immune: [] },
  water: { superEffective: ['fire', 'ground', 'rock'], notVeryEffective: ['water', 'grass', 'dragon'], immune: [] },
  electric: { superEffective: ['water', 'flying'], notVeryEffective: ['electric', 'grass', 'dragon'], immune: ['ground'] },
  grass: { superEffective: ['water', 'ground', 'rock'], notVeryEffective: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], immune: [] },
  ice: { superEffective: ['grass', 'ground', 'flying', 'dragon'], notVeryEffective: ['fire', 'water', 'ice', 'steel'], immune: [] },
  fighting: { superEffective: ['normal', 'ice', 'rock', 'dark', 'steel'], notVeryEffective: ['poison', 'flying', 'psychic', 'bug', 'fairy'], immune: ['ghost'] },
  poison: { superEffective: ['grass', 'fairy'], notVeryEffective: ['poison', 'ground', 'rock', 'ghost'], immune: ['steel'] },
  ground: { superEffective: ['fire', 'electric', 'poison', 'rock', 'steel'], notVeryEffective: ['grass', 'bug'], immune: ['flying'] },
  flying: { superEffective: ['grass', 'fighting', 'bug'], notVeryEffective: ['electric', 'rock', 'steel'], immune: ['ground'] },
  psychic: { superEffective: ['fighting', 'poison'], notVeryEffective: ['psychic', 'steel'], immune: ['dark'] },
  bug: { superEffective: ['grass', 'psychic', 'dark'], notVeryEffective: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], immune: [] },
  rock: { superEffective: ['fire', 'ice', 'flying', 'bug'], notVeryEffective: ['fighting', 'ground', 'steel'], immune: [] },
  ghost: { superEffective: ['psychic', 'ghost'], notVeryEffective: ['dark'], immune: ['normal'] },
  dragon: { superEffective: ['dragon'], notVeryEffective: ['steel'], immune: ['fairy'] },
  dark: { superEffective: ['psychic', 'ghost'], notVeryEffective: ['fighting', 'dark', 'fairy'], immune: [] },
  steel: { superEffective: ['ice', 'rock', 'fairy'], notVeryEffective: ['fire', 'water', 'electric', 'steel'], immune: ['poison'] },
  fairy: { superEffective: ['fighting', 'dragon', 'dark'], notVeryEffective: ['fire', 'poison', 'steel'], immune: ['dragon'] },
};

const isSuperEffective = (attackingType, defendingType) => {
  return typeEffectiveness[attackingType]?.superEffective.includes(defendingType);
};

const isNotVeryEffective = (attackingType, defendingType) => {
  return typeEffectiveness[attackingType]?.notVeryEffective.includes(defendingType);
};

const isNeutral = (attackingType, defendingType) => {
  return !isSuperEffective(attackingType, defendingType) && !isNotVeryEffective(attackingType, defendingType);
};

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
      const message = `${players.white.name} challenged ${players.black.name} to a Pokémon Battle!`;
      console.log(`Emitting message to players: ${message}`);
      io.to(players.white.id).emit('startGame', { gameId, players, color: 'white', fen: chess.getFen(), pieces, piecePokemonMap });
      io.to(players.black.id).emit('startGame', { gameId, players, color: 'black', fen: chess.getFen(), pieces, piecePokemonMap });
      io.to(players.white.id).emit('newMessage', message);
      io.to(players.black.id).emit('newMessage', message);
    } catch (err) {
      console.error('Error creating new game:', err);
    }
  });


  socket.on('joinGame', async ({ gameId, username }) => {

    try {
      const game = await Game.findOne({ gameId });

      if (game) {
        const isPlayerWhite = game.players.white.id === socket.id;
        const isPlayerBlack = game.players.black.id === socket.id;

        if (!isPlayerWhite && !isPlayerBlack) {
          if (!game.players.white.id) {
            game.players.white.id = socket.id;
            game.players.white.name = username || '';
            await game.save();
            socket.emit('playerColor', 'white');
          } else if (!game.players.black.id) {
            game.players.black.id = socket.id;
            game.players.black.name = username || '';
            await game.save();
            socket.emit('playerColor', 'black');
          } else {
            socket.emit('playerColor', 'spectator');
          }
        } else {
          const color = isPlayerWhite ? 'white' : 'black';
          socket.emit('playerColor', color);
        }

        socket.emit('gameState', {
          fen: game.fen,
          turn: game.turn,
          pieces: game.pieces,
          piecePokemonMap: game.piecePokemonMap
        });

        const whitePlayer = game.players.white.name;
        const blackPlayer = game.players.black.name;
        const message = `${whitePlayer} challenged ${blackPlayer} to a Pokémon Battle!`;
        io.to(socket.id).emit('newMessage', message);
      } else {
        console.log(`Game not found for ID: ${gameId}`);
      }
    } catch (error) {
      console.error(`Error finding game with ID: ${gameId}`, error);
    }
  });

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  app.post('/api/move/:gameId', async (req, res) => {
    const { gameId } = req.params;
    const { from, to } = req.body;

    console.log(`Move request received: gameId=${gameId}, from=${from}, to=${to}`);
    try {
      const game = await Game.findOne({ gameId });
      if (game) {
        const chess = new CustomChess();
        chess.load(game.fen);

        const result = chess.move(from, to, game.piecePokemonMap);

        if (result.valid) {
          game.fen = chess.getFen();
          game.updated_at = Date.now();
          game.turn = chess.getTurn(); // Switch turn

          // Update pieces based on new board state without reinitializing
          const updatedPieces = new Map(game.pieces); // Ensure proper Map type
          const fromKey = `${from[0]}${from[1]}`;
          const toKey = `${to[0]}${to[1]}`;

          // Handle piece movement
          const attackingPiece = updatedPieces.get(fromKey);
          const defendingPiece = updatedPieces.get(toKey);
          const attackingPlayer = game.players[attackingPiece.color === 'white' ? 'white' : 'black'];
          const defendingPlayer = game.players[defendingPiece?.color === 'white' ? 'white' : 'black'];

          const attackingPokemon = capitalizeFirstLetter(attackingPiece.pokemon);
          const defendingPokemon = defendingPiece ? capitalizeFirstLetter(defendingPiece.pokemon) : null;

          updatedPieces.set(toKey, attackingPiece);
          updatedPieces.delete(fromKey);

          if (defendingPiece) {
            if (isSuperEffective(attackingPiece.pokemonType, defendingPiece.pokemonType)) {
              updatedPieces.set(toKey, attackingPiece);
              updatedPieces.delete(fromKey);
              io.to(game.players.white.id).emit('newMessage', `${attackingPlayer.name}'s ${attackingPokemon} attacked ${defendingPlayer.name}'s ${defendingPokemon}`);
              io.to(game.players.black.id).emit('newMessage', `${attackingPlayer.name}'s ${attackingPokemon} attacked ${defendingPlayer.name}'s ${defendingPokemon}`);
              io.to(game.players.white.id).emit('newMessage', `${defendingPlayer.name}'s ${defendingPokemon} fainted`);
              io.to(game.players.black.id).emit('newMessage', `${defendingPlayer.name}'s ${defendingPokemon} fainted`);
            } else if (isNotVeryEffective(attackingPiece.pokemonType, defendingPiece.pokemonType) || isNeutral(attackingPiece.pokemonType, defendingPiece.pokemonType)) {
              updatedPieces.delete(fromKey);
              updatedPieces.delete(toKey);
              io.to(game.players.white.id).emit('newMessage', `${attackingPlayer.name}'s ${attackingPokemon} attacked ${defendingPlayer.name}'s ${defendingPokemon}`);
              io.to(game.players.black.id).emit('newMessage', `${attackingPlayer.name}'s ${attackingPokemon} attacked ${defendingPlayer.name}'s ${defendingPokemon}`);
              io.to(game.players.white.id).emit('newMessage', `Both fainted`);
              io.to(game.players.black.id).emit('newMessage', `Both fainted`);
            }
          } else {
            updatedPieces.set(toKey, attackingPiece);
            updatedPieces.delete(fromKey);
          }

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
          const winner = game.players[result.winner === 'w' ? 'black' : 'white'].name;
          const loser = game.players[result.winner === 'w' ? 'white' : 'black'].name;
          const victoryMessage = `${winner} has defeated ${loser}`;
          io.to(game.players.white.id).emit('gameOver', { winner: result.winner });
          io.to(game.players.black.id).emit('gameOver', { winner: result.winner });
          io.to(game.players.white.id).emit('newMessage', victoryMessage);
          io.to(game.players.black.id).emit('newMessage', victoryMessage);
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

  socket.on('userLogout', ({ username }) => {
    // Remove user from the lobby and notify others
    onlineUsers = onlineUsers.filter(user => user.name !== username);
    io.emit('updateLobby', onlineUsers);
    io.emit('userLogout', { username });
  });

  socket.on('disconnect', () => {
    // Handle user disconnection if necessary
    const user = onlineUsers.find(user => user.id === socket.id);
    if (user) {
      onlineUsers = onlineUsers.filter(u => u.id !== socket.id);
      io.emit('updateLobby', onlineUsers);
      io.emit('userLogout', { username: user.name });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
