import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Lobby from './components/Lobby.jsx';
import GameWrapper from './components/GameWrapper.jsx';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuthState } from './hooks/useAuthState.js';
import { Chess } from 'chess.js';  // Ensure Chess is imported correctly
import './App.css';

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

export const initializePieces = (board) => {
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
  const [playerColor, setPlayerColor] = useState(null);
  const [turn, setTurn] = useState('w');

  const [user, loading] = useAuthState();
  const username = user?.username || 'Anonymous';

  useEffect(() => {
    if (!socket) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected:', newSocket.id);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [socket]);

  const createGame = async (username) => {
    try {
      const response = await axios.post('http://localhost:5000/api/new-game', { username });
      setGameId(response.data.gameId);
      chess.load(response.data.fen);
      const initialPieces = initializePieces(chess.board());
      setPieces(initialPieces);
    } catch (error) {
      console.error('Error creating new game:', error);
    }
  };

  useEffect(() => {
    if (username) {
      createGame(username);
    }
  }, [username]);

  const movePiece = async (fromX, fromY, toX, toY) => {
    if ((playerColor === 'white' && chess.turn() !== 'w') || (playerColor === 'black' && chess.turn() !== 'b')) {
      console.log('Not your turn!');
      return;
    }

    const toAlgebraic = (x, y) => {
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      return `${files[x]}${8 - y}`;
    };

    const from = toAlgebraic(fromX, fromY);
    const to = toAlgebraic(toX, toY);

    try {
      const response = await axios.post(`http://localhost:5000/api/move/${gameId}`, { from, to, playerColor });
      chess.load(response.data.fen);
      setTurn(response.data.turn);
      setPieces(initializePieces(chess.board()));
      if (response.data.gameOver) {
        setGameOver(response.data.gameOver);
      }
    } catch (error) {
      console.error(`Error during move from ${from} to ${to}:`, error);
    }
  };

  const restartGame = () => {
    if (socket) {
      socket.emit('restartGame', { gameId });
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/lobby" element={
        <ProtectedRoute>
          <Lobby />
        </ProtectedRoute>
      } />
      <Route path="/game/:gameId/:username/:color" element={
        <ProtectedRoute>
          <GameWrapper
            chess={chess}
            socket={socket}
            gameId={gameId}
            setGameId={setGameId}
            pieces={pieces}
            setPieces={setPieces}
            gameOver={gameOver}
            setGameOver={setGameOver}
            movePiece={movePiece}
            restartGame={restartGame}  // Pass restartGame as a prop
            playerColor={playerColor}
            setPlayerColor={setPlayerColor}
            turn={turn}
            setTurn={setTurn}
            username={username}
          />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Login />} />
    </Routes>
  );
};

export default App;
