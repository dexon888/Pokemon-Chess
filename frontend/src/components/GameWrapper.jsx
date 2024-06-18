import React, { useEffect } from 'react';
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

const GameWrapper = ({ chess, socket, gameId, setGameId, pieces, setPieces, gameOver, setGameOver, movePiece, restartGame, playerColor, setPlayerColor, username }) => {
  const { gameId: paramGameId } = useParams();

  useEffect(() => {
    if (paramGameId && paramGameId !== gameId) {
      setGameId(paramGameId);
    }
  }, [paramGameId, gameId, setGameId]);

  useEffect(() => {
    if (socket && gameId) {
      console.log(`Emitting joinGame event: gameId=${gameId}, username=${username}`); // Debug log
      socket.emit('joinGame', { gameId, username });

      socket.on('gameState', (fen) => {
        console.log('Received game state:', fen); // Debug log
        chess.load(fen);
        setPieces(initializePieces(chess.board()));
      });

      socket.on('invalidMove', (message) => {
        console.log(message);
      });

      socket.on('gameOver', (message) => {
        setGameOver(message);
      });

      socket.on('playerColor', (color) => {
        console.log('Assigned color:', color); // Debug log
        setPlayerColor(color);
      });

      return () => {
        socket.off('gameState');
        socket.off('invalidMove');
        socket.off('gameOver');
        socket.off('playerColor');
      };
    }
  }, [socket, gameId, chess, setGameOver, setPieces, setPlayerColor, username]);

  useEffect(() => {
    console.log('playerColor state updated:', playerColor); // Debug log
  }, [playerColor]);

  return (
    <GameContainer maxWidth="md">
      <Typography variant="h4">Pokémon Chess</Typography>
      <Typography variant="h6">Your color: {playerColor}</Typography>
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
