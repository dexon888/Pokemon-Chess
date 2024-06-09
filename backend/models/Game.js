const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  fen: { type: String, required: true },
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
