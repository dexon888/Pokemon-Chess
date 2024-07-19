const mongoose = require('mongoose');

const pieceSchema = new mongoose.Schema({
  type: { type: String, required: true },
  color: { type: String, required: true },
  pokemon: { type: String, required: true },
  sprite: { type: String, required: true },
  pokemonType: { type: String, required: true }
});

const gameSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  fen: { type: String, required: true },
  turn: { type: String, required: true, default: 'w' },
  pieces: { type: Map, of: pieceSchema },
  piecePokemonMap: { type: Map, of: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  players: {
    white: {
      id: { type: String, required: false, default: null }
    },
    black: {
      id: { type: String, required: false, default: null }
    }
  }
});

module.exports = mongoose.model('Game', gameSchema);
