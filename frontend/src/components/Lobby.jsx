import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/system';

const socket = io('http://localhost:5000');

const LobbyContainer = styled(Container)({
  backgroundColor: '#1d1d1d',
  padding: '20px',
  borderRadius: '10px',
  minHeight: '50vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const UsernameInput = styled(TextField)({
  marginBottom: '20px',
  backgroundColor: '#333',
  borderRadius: '5px',
  input: {
    color: '#fff',
  },
  label: {
    color: '#fff',
  },
});

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

    socket.on('startGame', ({ gameId, color, players }) => {
      navigate(`/game/${gameId}/${players[color].name}/${color}`);
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
    socket.on('startGame', ({ gameId, players, color }) => {
      navigate(`/game/${gameId}/${user.name}/${color}`);
    });
  };
  

  if (!user) {
    return (
      <LobbyContainer maxWidth="xs">
        <Typography variant="h4" color="primary" mb={2}>Enter your username to join the lobby</Typography>
        <UsernameInput
          variant="outlined"
          label="Username"
          fullWidth
          onBlur={(e) => handleJoinLobby(e.target.value)}
        />
      </LobbyContainer>
    );
  }

  return (
    <LobbyContainer maxWidth="md">
      <Typography variant="h4" color="primary" mb={2}>Welcome to the Lobby, {user.name}</Typography>
      <Typography variant="h5" color="secondary" mb={2}>Online Players:</Typography>
      <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
        {users.map((u) => (
          <ListItem key={u.id} sx={{ backgroundColor: '#333', borderRadius: '5px', marginBottom: '10px' }}>
            <ListItemText primary={u.user.name} sx={{ color: '#fff' }} />
            {u.id !== user.id && (
              <Button variant="contained" color="primary" onClick={() => handleChallengePlayer(u.user)}>
                Challenge
              </Button>
            )}
          </ListItem>
        ))}
      </List>
      <Typography variant="h5" color="secondary" mt={4} mb={2}>Challenges:</Typography>
      <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
        {challenges.map((challenger, index) => (
          <ListItem key={index} sx={{ backgroundColor: '#333', borderRadius: '5px', marginBottom: '10px' }}>
            <ListItemText primary={challenger.name} sx={{ color: '#fff' }} />
            <Button variant="contained" color="primary" onClick={() => handleAcceptChallenge(challenger)}>
              Accept
            </Button>
          </ListItem>
        ))}
      </List>
    </LobbyContainer>
  );
};

export default Lobby;
