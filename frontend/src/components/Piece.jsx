import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../constants';

const Piece = ({ type, color, pokemon, sprite, x, y, movePiece }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PIECE,
    item: { type, x, y },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        movePiece(item.x, item.y, dropResult.x, dropResult.y);
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const pieceColor = color === 'white' ? 'white' : 'black';
  const chessPiece = `/chess-pieces/${pieceColor}-${type}.png`;

  return (
    <div
      ref={drag}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <img
        src={chessPiece}
        alt={`${color} ${type}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />
      <img
        src={sprite}
        alt={`${pokemon}`}
        style={{
          width: '50%',
          height: '50%',
          position: 'absolute',
          top: '25%',
          left: '25%',
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default Piece;
