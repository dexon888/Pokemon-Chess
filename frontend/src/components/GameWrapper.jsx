import React, { useEffect, useState } from 'react';
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

const getPokemonForPiece = (piece) => {
  const pokemonMap = {
    p: 'pikachu',
    r: 'charizard',
    n: 'bulbasaur',
    b: 'squirtle',
    q: 'mewtwo',
    k: 'raichu',
  };
  return pokemonMap[piece.type] || 'pokeball';
};

const initializePieces = (board) => {
  let pieces = {};
  board.forEach((row, y) => {
    row.forEach((piece, x) => {
      if (piece) {
        pieces[`${x}${y}`] = {
          type: piece.type,
          color: piece.color,
          pokemon: getPokemonForPiece(piece),
        };
      }
    });
  });
  return pieces;
};

const GameWrapper = ({ chess, socket, gameId, setGameId, pieces, setPieces, gameOver, setGameOver, movePiece, restartGame, playerColor, setPlayerColor, turn, setTurn, username }) => {
  const { gameId: paramGameId, username: paramUsername, color: paramColor } = useParams();

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
      console.log(`Emitting joinGame event: gameId=${gameId}, username=${username}`);
      socket.emit('joinGame', { gameId, username });

      const handleGameState = ({ fen, turn, move }) => {
        console.log('Received game state:', { fen, turn, move });
        chess.load(fen);
        setTurn(turn);
        const updatedPieces = initializePieces(chess.board());
        setPieces(updatedPieces);
        console.log('Updated Pieces:', updatedPieces);
        console.log('Updated Turn:', turn);
      };

      const handlePlayerColor = (color) => {
        console.log(`Player color received: ${color}`);
        setPlayerColor(color);
      };

      const handleInvalidMove = (message) => {
        console.log('Received invalidMove:', message);
      };

      const handleGameOver = (message) => {
        console.log('Received gameOver:', message);
        setGameOver(message);
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
  }, [socket, gameId, chess, setPlayerColor, setGameOver, setPieces, username, setTurn]);

  useEffect(() => {
    console.log('playerColor state updated:', playerColor);
  }, [playerColor]);

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
    </GameContainer>
  );
};

export default GameWrapper;
