import React from 'react';
import Square from './Square';
import Piece from './Piece';

const BoardContainer = {
  width: '400px',
  height: '400px',
  display: 'flex',
  flexWrap: 'wrap',
};

const SquareContainer = {
  width: '12.5%',
  height: '12.5%',
};

const Board = ({ pieces, movePiece, playerColor }) => {
  console.log('Board Pieces:', pieces); // Debug log

  const renderSquare = (i) => {
    const x = i % 8;
    const y = Math.floor(i / 8);
    const piece = pieces[`${x}${y}`];
    console.log('Rendering Square', i, 'with Piece:', piece); // Debug log

    return (
      <div key={i} style={SquareContainer}>
        <Square x={x} y={y}>
          {piece && (
            <Piece
              type={piece.type}
              color={piece.color}
              pokemon={piece.pokemon}
              x={x}
              y={y}
              movePiece={movePiece}
              playerColor={playerColor} // Pass playerColor
            />
          )}
        </Square>
      </div>
    );
  };

  const squares = [];
  for (let i = 0; i < 64; i++) {
    squares.push(renderSquare(i));
  }

  return <div style={BoardContainer}>{squares}</div>;
};

export default Board;
