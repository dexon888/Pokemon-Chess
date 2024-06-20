import React, { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../constants';
import axios from 'axios';

const Piece = ({ type, color, pokemon, x, y, movePiece, playerColor }) => {
  const [sprite, setSprite] = useState('');
  const [chessPiece, setChessPiece] = useState('');

  useEffect(() => {
    const fetchSprite = async () => {
      try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
        setSprite(response.data.sprites.front_default);
      } catch (error) {
        console.error(`Error fetching sprite for ${pokemon}:`, error);
      }
    };

    fetchSprite();
  }, [pokemon]);

  useEffect(() => {
    const pieceColor = color === 'w' ? 'white' : 'black';
    setChessPiece(`/chess-pieces/${pieceColor}-${type}.png`);
  }, [type, color]);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PIECE,
    item: { type, x, y },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult && color.charAt(0) === playerColor.charAt(0)) {
        movePiece(item.x, item.y, dropResult.x, dropResult.y);
      }
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

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
