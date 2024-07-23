import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Board from './Board';
import Logout from './Logout';
import MessageBox from './MessageBox';
import TypeEmojiPopup from './TypeEmojiPopup';
import RosterPopup from './RosterPopup';
import TypeEffectivenessChart from './TypeEffectivenessChart';
import { Container, Typography, Box, Button } from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import PropTypes from 'prop-types';

const GameContainer = styled(Container)({
  backgroundColor: '#1d1d1d',
  padding: '20px',
  borderRadius: '10px',
  minHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
});

const BoardContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '20px 0',
});

const StyledTypography = styled(Typography)({
  fontSize: '48px',
  color: '#ffcb05',
  textShadow: '2px 2px 4px #3b4cca',
  fontWeight: 'bold',
});

const InteractiveText = styled(Typography)(({ colorType }) => ({
  fontSize: '18px',
  color: colorType === 'white' ? '#FFFFFF' : '#000000',
  backgroundColor: colorType === 'white' ? '#000000' : '#FFFFFF',
  padding: '5px 10px',
  borderRadius: '5px',
  margin: '10px 0',
  border: `2px solid ${colorType === 'white' ? '#FFFFFF' : '#000000'}`,
  textAlign: 'center',
  fontWeight: 'bold',
  textTransform: 'uppercase',
}));

const VictoryText = styled(Typography)({
  fontSize: '22px',
  color: '#00FF00',
  backgroundColor: '#000000',
  padding: '10px 20px',
  borderRadius: '5px',
  border: '2px solid #00FF00',
  textAlign: 'center',
  fontWeight: 'bold',
  textTransform: 'uppercase',
});

const GameWrapper = ({
  socket,
  pieces,
  setPieces,
  gameOver,
  setGameOver,
  restartGame,
  playerColor,
  setPlayerColor,
  turn,
  setTurn,
  username,
  setUsername,
  piecePokemonMap = {},
  setPiecePokemonMap,
}) => {
  const { gameId: paramGameId, username: paramUsername, color: paramColor } = useParams();
  const navigate = useNavigate();
  const initialized = useRef(false);
  const [gameId, setGameId] = useState(paramGameId || null);
  const [initialPiecePokemonMapSet, setInitialPiecePokemonMapSet] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typePopupVisible, setTypePopupVisible] = useState(false);
  const [rosterPopupVisible, setRosterPopupVisible] = useState(false);
  const [effectivenessPopupVisible, setEffectivenessPopupVisible] = useState(false);

  useEffect(() => {
    if (!initialized.current) {
      if (paramUsername) {
        setUsername(paramUsername);
      }
      if (paramColor) {
        setPlayerColor(paramColor);
      }
      initialized.current = true;
    }
  }, [paramUsername, paramColor, setPlayerColor, setUsername]);

  useEffect(() => {
    if (socket) {
      const handleGameState = ({ fen, turn, pieces, piecePokemonMap }) => {
        setPieces(pieces || {});
        if (!initialPiecePokemonMapSet && piecePokemonMap) {
          setPiecePokemonMap(piecePokemonMap);
          setInitialPiecePokemonMapSet(true);
        }
        setTurn(turn);
      };

      const handlePlayerColor = (color) => {
        setPlayerColor(color);
      };

      const handleInvalidMove = (message) => {
        console.log('Received invalidMove:', message);
      };

      const handleGameOver = ({ winner }) => {
        setGameOver(`${winner} wins by capturing the king!`);
      };

      const handleUserLogout = ({ username: loggedOutUsername }) => {
        if (username === loggedOutUsername) {
          navigate('/login');
        } else {
          navigate('/lobby');
        }
      };

      const handleNewMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      };

      socket.on('gameState', handleGameState);
      socket.on('playerColor', handlePlayerColor);
      socket.on('invalidMove', handleInvalidMove);
      socket.on('gameOver', handleGameOver);
      socket.on('userLogout', handleUserLogout);
      socket.on('newMessage', handleNewMessage);

      return () => {
        socket.off('gameState', handleGameState);
        socket.off('playerColor', handlePlayerColor);
        socket.off('invalidMove', handleInvalidMove);
        socket.off('gameOver', handleGameOver);
        socket.off('userLogout', handleUserLogout);
        socket.off('newMessage', handleNewMessage);
      };
    }
  }, [socket, username, setPlayerColor, setGameOver, setPieces, setTurn, setPiecePokemonMap, initialPiecePokemonMapSet, navigate]);

  useEffect(() => {
    if (socket && gameId) {
      socket.emit('joinGame', { gameId, username });
    }
  }, [socket, gameId, username]);

  const movePiece = async (fromX, fromY, toX, toY) => {
    if ((playerColor === 'white' && turn !== 'w') || (playerColor === 'black' && turn !== 'b')) {
      return;
    }

    const from = [fromX, fromY];
    const to = [toX, toY];

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/move/${gameId}`, { from, to });
      setPieces(response.data.pieces);
      setPiecePokemonMap(response.data.piecePokemonMap);

      // Ensure turn is updated correctly based on whether it was a super effective move
      if (!response.data.superEffectiveMove) {
        setTurn(response.data.turn);
      }
      
      if (response.data.gameOver) {
        setGameOver(`${response.data.winner} wins by capturing the king!`);
      }
    } catch (error) {
      console.error(`Error during move from ${from} to ${to}:`, error);
    }
  };

  return (
    <GameContainer maxWidth="md">
      <StyledTypography variant="h3" mb={2}>Pokémon Chess</StyledTypography>
      <InteractiveText variant="h6" colorType={playerColor}>Your color: {playerColor}</InteractiveText>
      <InteractiveText variant="h6" colorType={turn === 'w' ? 'white' : 'black'}>Current turn: {turn === 'w' ? 'White' : 'Black'}</InteractiveText>
      <Logout socket={socket} username={username} />
      {gameOver && <VictoryText variant="h6">{gameOver}</VictoryText>}
      <BoardContainer>
        {pieces && Object.keys(pieces).length > 0 ? (
          <Board pieces={pieces} movePiece={movePiece} playerColor={playerColor} />
        ) : (
          <Typography variant="h6">Loading pieces...</Typography>
        )}
      </BoardContainer>
      <MessageBox messages={messages} />
      <Button
        variant="contained"
        color="primary"
        onClick={() => setTypePopupVisible(true)}
        sx={{ position: 'fixed', bottom: '10px', left: '10px', zIndex: 1000 }}
      >
        Show Type Emojis
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setRosterPopupVisible(true)}
        sx={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 1000 }}
      >
        Show Roster
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setEffectivenessPopupVisible(true)}
        sx={{ position: 'fixed', bottom: '60px', right: '10px', zIndex: 1000 }}
      >
        Show Type Effectiveness
      </Button>
      <TypeEmojiPopup isVisible={typePopupVisible} onClose={() => setTypePopupVisible(false)} />
      <RosterPopup isVisible={rosterPopupVisible} onClose={() => setRosterPopupVisible(false)} piecePokemonMap={piecePokemonMap} pieces={pieces} />
      <TypeEffectivenessChart isVisible={effectivenessPopupVisible} onClose={() => setEffectivenessPopupVisible(false)} />
    </GameContainer>
  );
};

GameWrapper.propTypes = {
  socket: PropTypes.object.isRequired,
  pieces: PropTypes.object.isRequired,
  setPieces: PropTypes.func.isRequired,
  gameOver: PropTypes.string,
  setGameOver: PropTypes.func.isRequired,
  restartGame: PropTypes.func.isRequired,
  playerColor: PropTypes.string.isRequired,
  setPlayerColor: PropTypes.func.isRequired,
  turn: PropTypes.string.isRequired,
  setTurn: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  setUsername: PropTypes.func.isRequired,
  piecePokemonMap: PropTypes.object.isRequired,
  setPiecePokemonMap: PropTypes.func.isRequired,
};

export default GameWrapper;
