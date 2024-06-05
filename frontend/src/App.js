// src/App.js
import React, { useState } from 'react';
import './App.css';
import Board from './components/Board';
import { Chess } from 'chess.js';

const App = () => {
  const getPokemonForPiece = (piece) => {
    const pokemonMap = {
      p: 'pikachu',
      r: 'charizard',
      n: 'bulbasaur',
      b: 'squirtle',
      q: 'mewtwo',
      k: 'raichu',
    };
    return pokemonMap[piece.type] || 'pokeball';
  };

  const initializePieces = (board) => {
    let pieces = {};
    board.forEach((row, y) => {
      row.forEach((piece, x) => {
        if (piece) {
          pieces[`${x}${y}`] = {
            type: piece.type,
            color: piece.color,
            pokemon: getPokemonForPiece(piece),
          };
        }
      });
    });
    return pieces;
  };

  const updatePieces = (board) => {
    let pieces = {};
    board.forEach((row, y) => {
      row.forEach((piece, x) => {
        if (piece) {
          pieces[`${x}${y}`] = {
            type: piece.type,
            color: piece.color,
            pokemon: getPokemonForPiece(piece),
          };
        }
      });
    });
    return pieces;
  };

  const [chess, setChess] = useState(new Chess());
  const [pieces, setPieces] = useState(initializePieces(chess.board()));
  const [gameOver, setGameOver] = useState(null);

  const movePiece = (fromX, fromY, toX, toY) => {
    const toAlgebraic = (x, y) => {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      return `${files[x]}${8 - y}`;
    };

    const from = toAlgebraic(fromX, fromY);
    const to = toAlgebraic(toX, toY);

    try {
      const move = chess.move({ from, to, promotion: 'q' });

      if (move === null) {
        console.log(`Invalid move from ${from} to ${to}`);
        return;
      }

      setPieces(updatePieces(chess.board()));

      // Check for game over
      if (chess.isCheckmate()) {
        setGameOver(chess.turn() === 'w' ? 'Black wins!' : 'White wins!');
      } else if (chess.isStalemate()) {
        setGameOver('Draw!');
      }
    } catch (error) {
      console.error(`Error during move from ${from} to ${to}:`, error);
    }
  };

  const restartGame = () => {
    const newChess = new Chess();
    setChess(newChess);
    setPieces(initializePieces(newChess.board()));
    setGameOver(null);
  };

  return (
    <div className="App">
      <h1>Pokémon Chess</h1>
      {gameOver && <h2>{gameOver}</h2>}
      <Board pieces={pieces} movePiece={movePiece} />
      <button onClick={restartGame}>Restart Game</button>
    </div>
  );
};

export default App;
