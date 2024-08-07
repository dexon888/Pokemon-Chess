import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Typography, List, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/system';
import Logout from './Logout';

// Styles for the lobby components
const LobbyContainer = styled(Container)({
  backgroundColor: '#1d1d1d',
  padding: '20px',
  borderRadius: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  maxWidth: '400px',
  margin: 'auto',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
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

const PlayerList = styled(List)({
  width: '100%',
  backgroundColor: 'background.paper',
  padding: 0,
  margin: 0,
  overflow: 'auto',
  maxHeight: '200px',
});

const PlayerListItem = styled(ListItem)({
  backgroundColor: '#333',
  borderRadius: '5px',
  marginBottom: '10px',
  padding: '10px',
  '&:last-child': {
    marginBottom: 0,
  },
});

const Lobby = ({ socket, setUsername }) => {
  const [users, setUsers] = useState([]);
  const [username, setLocalUsername] = useState('');
  const [challenges, setChallenges] = useState([]);
  const navigate = useNavigate();

  // Set up socket event listeners
  useEffect(() => {
    socket.on('updateLobby', (users) => {
      setUsers(users);
    });

    socket.on('receiveChallenge', ({ challenger }) => {
      setChallenges((prev) => {
        if (!prev.find(challenge => challenge.id === challenger.id)) {
          return [...prev, challenger];
        }
        return prev;
      });
    });

    socket.on('startGame', ({ gameId, players, color }) => {
      navigate(`/game/${gameId}/${username}/${color}`);
    });

    socket.on('userLogout', ({ username: loggedOutUsername }) => {
      setUsers((prevUsers) => prevUsers.filter((user) => user.name !== loggedOutUsername));
    });

    return () => {
      socket.off('updateLobby');
      socket.off('receiveChallenge');
      socket.off('startGame');
      socket.off('userLogout');
    };
  }, [socket, navigate, username]);

  // Handle user joining the lobby
  const handleJoinLobby = (username) => {
    const user = { id: socket.id, name: username };
    setLocalUsername(username);
    setUsername(username);
    socket.emit('joinLobby', user);
  };

  // Handle challenging another player
  const handleChallengePlayer = (challengee) => {
    if (!challenges.find(challenge => challenge.id === challengee.id)) {
      socket.emit('challengePlayer', { challenger: { id: socket.id, name: username }, challengee });
    }
  };

  // Handle accepting a challenge
  const handleAcceptChallenge = (challenger) => {
    socket.emit('acceptChallenge', { challenger, challengee: { id: socket.id, name: username } });
  };

  if (!username) {
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
      <Typography variant="h4" color="primary" mb={2}>Welcome to the Lobby, {username}</Typography>
      <Typography variant="h5" color="secondary" mb={2}>Online Players:</Typography>
      <Logout socket={socket} username={username} />
      <PlayerList>
        {users.map((u) => (
          <PlayerListItem key={u.id}>
            <ListItemText primary={u.user.name} sx={{ color: '#fff' }} />
            {u.id !== socket.id && (
              <Button variant="contained" color="primary" onClick={() => handleChallengePlayer(u.user)}>
                Challenge
              </Button>
            )}
          </PlayerListItem>
        ))}
      </PlayerList>
      <Typography variant="h5" color="secondary" mt={4} mb={2}>Challenges:</Typography>
      <PlayerList>
        {challenges.map((challenger, index) => (
          <PlayerListItem key={index}>
            <ListItemText primary={challenger.name} sx={{ color: '#fff' }} />
            <Button variant="contained" color="primary" onClick={() => handleAcceptChallenge(challenger)}>
              Accept
            </Button>
          </PlayerListItem>
        ))}
      </PlayerList>
    </LobbyContainer>
  );
};

export default Lobby;
