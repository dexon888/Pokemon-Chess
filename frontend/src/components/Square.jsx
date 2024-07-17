import React from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../constants';

const Square = ({ x, y, children }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.PIECE,
    drop: () => ({ x, y }),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const black = (x + y) % 2 === 1;
  const fill = black ? 'black' : 'white';
  const stroke = black ? 'white' : 'black';

  return (
    <div
      ref={drop}
      style={{
        backgroundColor: fill,
        color: stroke,
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {children}
      {isOver && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            zIndex: 1,
            opacity: 0.5,
            backgroundColor: 'yellow',
          }}
        />
      )}
    </div>
  );
};

export default Square;
