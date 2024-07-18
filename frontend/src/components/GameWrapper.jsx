import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Board from './Board';
import Logout from './Logout';
import { Container, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/system';
import { initializePieces } from '../utils';

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
  gameId,
  setGameId,
  pieces,
  setPieces,
  gameOver,
  setGameOver,
  movePiece,
  restartGame,
  playerColor,
  setPlayerColor,
  turn,
  setTurn,
  username
}) => {
  const { gameId: paramGameId, username: paramUsername, color: paramColor } = useParams();
  const [piecePokemonMap, setPiecePokemonMap] = useState(null);

  useEffect(() => {
    if (paramGameId && paramGameId !== gameId) {
      setGameId(paramGameId);
    }
    if (paramUsername && paramUsername !== username) {
      username = paramUsername;
    }
    if (paramColor && paramColor !== playerColor) {
      setPlayerColor(paramColor);
    }
  }, [paramGameId, gameId, setGameId, paramUsername, username, paramColor, playerColor, setPlayerColor]);

  useEffect(() => {
    if (socket) {
      console.log(`Setting up socket listeners for gameId=${gameId}, username=${username}`);

      socket.emit('joinGame', { gameId, username });

      const handleGameState = async ({ fen, turn, move, piecePokemonMap }) => {
        console.log('Received game state:', { fen, turn, move });
        const { pieces, piecePokemonMap: newPiecePokemonMap } = await initializePieces(fen, piecePokemonMap);
        setPieces(pieces);
        setPiecePokemonMap(newPiecePokemonMap);
        setTurn(turn);
        console.log('Updated Pieces:', pieces);
        console.log('Updated Turn:', turn);
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
  }, [socket, gameId, setPlayerColor, setGameOver, setPieces, username, setTurn, piecePokemonMap]);

  useEffect(() => {
    console.log('playerColor state updated:', playerColor);
  }, [playerColor]);

  const emitTestEvent = () => {
    console.log('Emitting test event');
    socket.emit('testEvent', { message: 'Test event emitted' });
  };

  return (
    <GameContainer maxWidth="md">
      <Typography variant="h4">Pokémon Chess</Typography>
      <Typography variant="h6">Your color: {playerColor}</Typography>
      <Typography variant="h6">Current turn: {turn === 'w' ? 'White' : 'Black'}</Typography>
      <Logout />
      {gameOver && <Typography variant="h6">{gameOver}</Typography>}
      <BoardContainer>
        <Board pieces={pieces} movePiece={movePiece} playerColor={playerColor} />
      </BoardContainer>
      <Button variant="contained" color="primary" onClick={restartGame}>Restart Game</Button>
      <Button variant="contained" color="secondary" onClick={emitTestEvent}>Emit Test Event</Button>
    </GameContainer>
  );
};

export default GameWrapper;
