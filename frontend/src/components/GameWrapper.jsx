import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Board from './Board';
import Logout from './Logout';
import { Container, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/system';

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
  username,
  setPiecePokemonMap
}) => {
  const { gameId: paramGameId, username: paramUsername, color: paramColor } = useParams();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      if (paramGameId && paramGameId !== gameId) {
        setGameId(paramGameId);
        console.log(`Set gameId from params: ${paramGameId}`);
      }
      if (paramColor && paramColor !== playerColor) {
        setPlayerColor(paramColor);
        console.log(`Set playerColor from params: ${paramColor}`);
      }
      initialized.current = true;
    }
  }, [paramGameId, gameId, setGameId, paramColor, playerColor, setPlayerColor]);

  useEffect(() => {
    if (socket && gameId) {
      console.log(`Setting up socket listeners for gameId=${gameId}, username=${paramUsername}`);

      socket.emit('joinGame', { gameId, username: paramUsername });
      console.log('Emitting joinGame event:', { gameId, username: paramUsername });

      const handleGameState = ({ fen, turn, pieces, piecePokemonMap }) => {
        console.log('Received game state:', { fen, turn, pieces, piecePokemonMap });
        if (pieces) {
          setPieces(pieces);
        }
        if (piecePokemonMap) {
          setPiecePokemonMap(piecePokemonMap);
        }
        if (turn) {
          setTurn(turn);
        }
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
  }, [socket, gameId, paramUsername, setPlayerColor, setGameOver, setPieces, setTurn, setPiecePokemonMap]);

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
        {pieces && Object.keys(pieces).length > 0 ? (
          <Board pieces={pieces} movePiece={movePiece} playerColor={playerColor} />
        ) : (
          <Typography variant="h6">Loading pieces...</Typography>
        )}
      </BoardContainer>
      <Button variant="contained" color="primary" onClick={restartGame}>Restart Game</Button>
      <Button variant="contained" color="secondary" onClick={emitTestEvent}>Emit Test Event</Button>
    </GameContainer>
  );
};

export default GameWrapper;
