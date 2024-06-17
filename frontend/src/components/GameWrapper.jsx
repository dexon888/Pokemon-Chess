import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Board from './Board';
import Logout from './Logout';

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

const GameWrapper = ({ chess, socket, gameId, setGameId, pieces, setPieces, gameOver, setGameOver, movePiece, restartGame, playerColor, setPlayerColor }) => {
  const { gameId: paramGameId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (paramGameId && paramGameId !== gameId) {
      setGameId(paramGameId);
    }
  }, [paramGameId, gameId, setGameId]);

  useEffect(() => {
    if (socket && gameId) {
      console.log('Joining game:', gameId); // Debug log
      socket.emit('joinGame', { gameId });

      socket.on('gameState', (fen) => {
        console.log('Received game state:', fen); // Debug log
        chess.load(fen);
        const updatedPieces = initializePieces(chess.board());
        setPieces(updatedPieces);
        console.log('Updated Pieces:', updatedPieces); // Debug log
      });

      socket.on('invalidMove', (message) => {
        console.log(message);
      });

      socket.on('gameOver', (message) => {
        setGameOver(message);
      });

      socket.on('playerColor', (color) => {
        if (color !== 'none') {
          console.log('Assigned color:', color); // Debug log
          setPlayerColor(color);
        } else {
          console.log('Game is full.');
          alert('This game is already full. You cannot join as a player.');
          navigate('/lobby');
        }
      });

      socket.on('gameFull', ({ message }) => {
        console.log(message);
        alert(message);
        navigate('/lobby');
      });

      return () => {
        socket.off('gameState');
        socket.off('invalidMove');
        socket.off('gameOver');
        socket.off('playerColor');
        socket.off('gameFull');
      };
    }
  }, [socket, gameId, chess, setPieces, setGameOver, setPlayerColor, navigate]);

  return (
    <div className="App">
      <h1>Pokémon Chess</h1>
      <h2>Your color: {playerColor}</h2>
      <Logout />
      {gameOver && <h2>{gameOver}</h2>}
      <Board pieces={pieces} movePiece={movePiece} />
      <button onClick={restartGame}>Restart Game</button>
    </div>
  );
};

export default GameWrapper;
