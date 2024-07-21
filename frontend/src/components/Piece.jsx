import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../constants';
import typeEmojis from '../typeEmojis';

const Piece = ({ type, color, pokemon, sprite, x, y, movePiece, pokemonType }) => {
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
  const typeEmoji = typeEmojis[pokemonType];

  return (
    <div
      ref={drag}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        opacity: isDragging ? 0.5 : 1,
        textAlign: 'center',
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
          top: '20%',
          left: '25%',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '5%', // Adjust the vertical position
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '18px', // Adjust the font size
          zIndex: 3, // Ensure emoji is on top
        }}
      >
        {typeEmoji}
      </div>
    </div>
  );
};

export default Piece;
