// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import axios from 'axios';
import { Chess } from 'chess.js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

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

const App = () => {
  const [gameId, setGameId] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [chess, setChess] = useState(new Chess());

  useEffect(() => {
    const createGame = async () => {
      try {
        const response = await axios.post('http://localhost:5000/api/new-game');
        setGameId(response.data.gameId);
        chess.load(response.data.fen);
        setPieces(initializePieces(chess.board()));
      } catch (error) {
        console.error('Error creating new game:', error);
      }
    };

    createGame();
  }, []);

  const movePiece = async (fromX, fromY, toX, toY) => {
    const toAlgebraic = (x, y) => {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      return `${files[x]}${8 - y}`;
    };

    const from = toAlgebraic(fromX, fromY);
    const to = toAlgebraic(toX, toY);

    try {
      const response = await axios.post(`http://localhost:5000/api/move/${gameId}`, { from, to });
      chess.load(response.data.fen);
      setPieces(initializePieces(chess.board()));

      if (response.data.gameOver) {
        setGameOver(response.data.gameOver);
      }
    } catch (error) {
      console.error(`Error during move from ${from} to ${to}:`, error);
      // Reset the piece to its original position if the move is invalid
      setPieces(initializePieces(chess.board()));
    }
  };

  const restartGame = async () => {
    try {
      const response = await axios.post(`http://localhost:5000/api/restart/${gameId}`);
      chess.load(response.data.fen);
      setPieces(initializePieces(chess.board()));
      setGameOver(null);
    } catch (error) {
      console.error('Error restarting game:', error);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/game" element={
          <ProtectedRoute>
            <div className="App">
              <h1>Pokémon Chess</h1>
              {gameOver && <h2>{gameOver}</h2>}
              <Board pieces={pieces} movePiece={movePiece} />
              <button onClick={restartGame}>Restart Game</button>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
