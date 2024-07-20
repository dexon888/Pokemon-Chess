import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Board from './Board';
import Logout from './Logout';
import { Container, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';

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
  setPiecePokemonMap
}) => {
  const { gameId: paramGameId, username: paramUsername, color: paramColor } = useParams();
  const initialized = useRef(false);
  const [gameId, setGameId] = useState(paramGameId || null);
  const [initialPiecePokemonMapSet, setInitialPiecePokemonMapSet] = useState(false);

  useEffect(() => {
    if (!initialized.current) {
      if (paramUsername) {
        username = paramUsername;
        console.log(`Set username from params: ${paramUsername}`);
      }
      if (paramColor) {
        setPlayerColor(paramColor);
        console.log(`Set playerColor from params: ${paramColor}`);
      }
      initialized.current = true;
    }
  }, [paramUsername, username, paramColor, playerColor, setPlayerColor]);

  useEffect(() => {
    if (socket && gameId) {
      console.log(`Setting up socket listeners for gameId=${gameId}, username=${username}`);

      socket.emit('joinGame', { gameId, username });
      console.log('Emitting joinGame event:', { gameId, username });

      const handleGameState = ({ fen, turn, pieces, piecePokemonMap }) => {
        console.log('Received game state:', { fen, turn, pieces, piecePokemonMap });
        setPieces(pieces || {});
        if (!initialPiecePokemonMapSet && piecePokemonMap) {
          setPiecePokemonMap(piecePokemonMap);
          setInitialPiecePokemonMapSet(true);
        }
        setTurn(turn);
        console.log('Updated Pieces:', pieces);
        console.log('Updated Turn:', turn);
        console.log('Updated Piece Pokemon Map:', piecePokemonMap);
      };

      const handlePlayerColor = (color) => {
        console.log(`Player color received: ${color}`);
        setPlayerColor(color);
      };

      const handleInvalidMove = (message) => {
        console.log('Received invalidMove:', message);
      };

      const handleGameOver = ({ winner }) => {
        console.log(`Received gameOver: ${winner} wins`);
        setGameOver(`${winner} wins by capturing the king!`);
      };

      socket.on('gameState', handleGameState);
      socket.on('playerColor', handlePlayerColor);
      socket.on('invalidMove', handleInvalidMove);
      socket.on('gameOver', handleGameOver);

      return () => {
        console.log('Cleaning up socket listeners');
        socket.off('gameState', handleGameState);
        socket.off('playerColor', handlePlayerColor);
        socket.off('invalidMove', handleInvalidMove);
        socket.off('gameOver', handleGameOver);
      };
    }
  }, [socket, gameId, username, setPlayerColor, setGameOver, setPieces, setTurn, setPiecePokemonMap, initialPiecePokemonMapSet]);

  useEffect(() => {
    console.log('playerColor state updated:', playerColor);
  }, [playerColor]);

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
      setPiecePokemonMap(response.data.piecePokemonMap);  // This should be avoided if you want to keep it constant
      setTurn(response.data.turn);
      if (response.data.gameOver) {
        setGameOver(`${response.data.winner} wins by capturing the king!`);
      }
    } catch (error) {
      console.error(`Error during move from ${from} to ${to}:`, error);
    }
  };


  return (
    <GameContainer maxWidth="md">
      <Typography variant="h4">Pokémon Chess</Typography>
      <Typography variant="h6">Your color: {playerColor}</Typography>
      <Typography variant="h6">Current turn: {turn === 'w' ? 'White' : 'Black'}</Typography>
      <Logout />
      {gameOver && <Typography variant="h6">{gameOver}</Typography>}
      <BoardContainer>
        {pieces && Object.keys(pieces).length > 0 ? (
          <Board pieces={pieces} movePiece={movePiece} playerColor={playerColor} />
        ) : (
          <Typography variant="h6">Loading pieces...</Typography>
        )}
      </BoardContainer>
    </GameContainer>
  );
};

export default GameWrapper;
