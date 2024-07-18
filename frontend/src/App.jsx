import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import GameWrapper from './components/GameWrapper.jsx';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Lobby from './components/Lobby';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './supabaseClient';

const App = () => {
  const [gameId, setGameId] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [socket, setSocket] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [turn, setTurn] = useState('w');
  const [piecePokemonMap, setPiecePokemonMap] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  const createGame = async (username) => {
    try {
      const response = await axios.post('http://localhost:5000/api/new-game', { username });
      setGameId(response.data.gameId);
      setPieces(response.data.pieces);
      setPiecePokemonMap(response.data.piecePokemonMap);
      setTurn('w'); // Set initial turn to white
    } catch (error) {
      console.error('Error creating new game:', error);
    }
  };

  const movePiece = async (fromX, fromY, toX, toY) => {
    if ((playerColor === 'white' && turn !== 'w') || (playerColor === 'black' && turn !== 'b')) {
      console.log('Not your turn!');
      return;
    }

    const from = [fromX, fromY];
    const to = [toX, toY];

    try {
      const response = await axios.post(`http://localhost:5000/api/move/${gameId}`, { from, to });
      setPieces(response.data.pieces);
      setPiecePokemonMap(response.data.piecePokemonMap);
      setTurn(response.data.turn); // Update the turn state
      if (response.data.gameOver) {
        setGameOver(`${response.data.winner} wins by capturing the king!`);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/lobby" element={<ProtectedRoute><Lobby socket={socket} user={user} /></ProtectedRoute>} />
      <Route
        path="/game/:gameId/:username/:color"
        element={
          <ProtectedRoute>
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
              username={user?.email || 'Anonymous'}
              piecePokemonMap={piecePokemonMap}
              setPiecePokemonMap={setPiecePokemonMap}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;
