// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import Board from './components/Board';
import { Chess } from 'chess.js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Logout from './components/Logout.jsx';
import io from 'socket.io-client';

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
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    setSocket(newSocket);

    return () => newSocket.close();
  }, [setSocket]);

  useEffect(() => {
    if (socket && gameId) {
      socket.emit('joinGame', { gameId });

      socket.on('gameState', (fen) => {
        chess.load(fen);
        setPieces(initializePieces(chess.board()));
      });

      socket.on('invalidMove', (message) => {
        console.log(message);
      });

      socket.on('gameOver', (message) => {
        setGameOver(message);
      });
    }
  }, [socket, gameId, chess]);

  const createGame = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/new-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setGameId(data.gameId);
      chess.load(data.fen);
      setPieces(initializePieces(chess.board()));
    } catch (error) {
      console.error('Error creating new game:', error);
    }
  };

  useEffect(() => {
    createGame();
  }, []);

  const movePiece = (fromX, fromY, toX, toY) => {
    const toAlgebraic = (x, y) => {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      return `${files[x]}${8 - y}`;
    };

    const from = toAlgebraic(fromX, fromY);
    const to = toAlgebraic(toX, toY);

    if (socket) {
      socket.emit('makeMove', { gameId, from, to });
    }
  };

  const restartGame = () => {
    if (socket) {
      socket.emit('restartGame', { gameId });
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
              <Logout />
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
