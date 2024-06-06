// src/components/Lobby.jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io('http://localhost:5000');

const Lobby = () => {
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('updateLobby', (users) => {
      setUsers(users);
    });

    socket.on('receiveChallenge', ({ challenger }) => {
      setChallenges((prev) => [...prev, challenger]);
    });

    socket.on('startGame', ({ gameId, players }) => {
      navigate(`/game/${gameId}`, { state: { players } });
    });

    return () => {
      socket.off('updateLobby');
      socket.off('receiveChallenge');
      socket.off('startGame');
    };
  }, [navigate]);

  const handleJoinLobby = (username) => {
    const user = { id: socket.id, name: username };
    setUser(user);
    socket.emit('joinLobby', user);
  };

  const handleChallengePlayer = (challengee) => {
    socket.emit('challengePlayer', { challenger: user, challengee });
  };

  const handleAcceptChallenge = (challenger) => {
    socket.emit('acceptChallenge', { challenger, challengee: user });
  };

  if (!user) {
    return (
      <div>
        <h1>Enter your username to join the lobby</h1>
        <input type="text" onBlur={(e) => handleJoinLobby(e.target.value)} />
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to the Lobby, {user.name}</h1>
      <h2>Online Players:</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} {u.id !== user.id && <button onClick={() => handleChallengePlayer(u)}>Challenge</button>}
          </li>
        ))}
      </ul>
      <h2>Challenges:</h2>
      <ul>
        {challenges.map((challenger, index) => (
          <li key={index}>
            {challenger.name} <button onClick={() => handleAcceptChallenge(challenger)}>Accept</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
