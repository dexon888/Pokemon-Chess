import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import GameWrapper from './components/GameWrapper';
import io from 'socket.io-client';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import Lobby from './components/Lobby';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './supabaseClient';

const socket = io(process.env.REACT_APP_BACKEND_URL); // Use the environment variable here

const App = () => {
  const [gameId, setGameId] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [turn, setTurn] = useState('w');
  const [piecePokemonMap, setPiecePokemonMap] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUsername(user?.email || '');
      setLoading(false);
    };
    checkUser();
  }, []);

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
      <Route path="/lobby" element={<ProtectedRoute><Lobby socket={socket} setUsername={setUsername} /></ProtectedRoute>} />
      <Route
        path="/game/:gameId/:username/:color"
        element={
          <ProtectedRoute>
            <GameWrapper
              socket={socket}
              pieces={pieces}
              setPieces={setPieces}
              gameOver={gameOver}
              setGameOver={setGameOver}
              restartGame={restartGame}
              playerColor={playerColor}
              setPlayerColor={setPlayerColor}
              turn={turn}
              setTurn={setTurn}
              username={username}
              setUsername={setUsername}
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
