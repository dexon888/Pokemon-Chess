const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  fen: { type: String, required: true },
  turn: { type: String, required: true, default: 'w' },
  pieces: { type: Map, of: new mongoose.Schema({
    type: { type: String, required: true },
    color: { type: String, required: true },
    pokemon: { type: String, required: true },
    sprite: { type: String, required: true },
    pokemonType: { type: String, required: true }
  })},
  piecePokemonMap: { type: Map, of: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  players: {
    white: {
      id: { type: String, required: false, default: null }  // Allow null initially
    },
    black: {
      id: { type: String, required: false, default: null }  // Allow null initially
    }
  }
});

module.exports = mongoose.model('Game', gameSchema);
