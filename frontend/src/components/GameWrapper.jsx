import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Board from './Board';
import Logout from './Logout';
import { initializePieces } from '../App'; // Make sure this import path is correct

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
        console.log('Assigned color:', color); // Debug log
        setPlayerColor(color);
      });
    }
  }, [socket, gameId, chess, setPieces, setGameOver, setPlayerColor]);

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
