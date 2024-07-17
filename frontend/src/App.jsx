import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import GameWrapper from './components/GameWrapper.jsx';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';
import { initializePieces } from './utils';

const App = () => {
  const [gameId, setGameId] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [socket, setSocket] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [turn, setTurn] = useState('w');

  // Temporarily bypassing authentication for development purposes
  const user = { username: 'Anonymous' };
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
      const initialPieces = await initializePieces(response.data.board);
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
    if ((playerColor === 'white' && turn !== 'w') || (playerColor === 'black' && turn !== 'b')) {
      console.log('Not your turn!');
      return;
    }

    const from = [fromX, fromY];
    const to = [toX, toY];

    try {
      const response = await axios.post(`http://localhost:5000/api/move/${gameId}`, { from, to, playerColor });
      const updatedPieces = await initializePieces(response.data.fen);
      setPieces(updatedPieces);
      setTurn(response.data.turn);
      if (response.data.gameOver) {
        setGameOver(`${playerColor === 'w' ? 'White' : 'Black'} wins by capturing the king!`);
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
      <Route
        path="/"
        element={
          <GameWrapper
            socket={socket}
            gameId={gameId}
            setGameId={setGameId}
            pieces={pieces}
            setPieces={setPieces}
            gameOver={gameOver}
            setGameOver={setGameOver}
            movePiece={movePiece}
            restartGame={restartGame}
            playerColor={playerColor}
            setPlayerColor={setPlayerColor}
            turn={turn}
            setTurn={setTurn}
            username={username}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
