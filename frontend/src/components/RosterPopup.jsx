import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';

const PopupContainer = styled(Box)(({ isVisible }) => ({
  position: 'fixed',
  bottom: isVisible ? '10px' : '-100%',
  right: '10px',
  width: '300px',
  maxHeight: '400px',
  backgroundColor: '#2e2e2e',
  color: '#fff',
  borderRadius: '10px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  transition: 'bottom 0.5s ease-in-out',
  overflow: 'auto',
  zIndex: 1000,
  padding: '10px',
}));

const Header = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #444',
  paddingBottom: '5px',
  marginBottom: '10px',
});

const PieceInfo = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
  borderBottom: '1px solid #444',
});

const pieceTypeToName = (type) => {
  switch (type) {
    case 'N':
      return 'Knight';
    case 'R':
      return 'Rook';
    case 'K':
      return 'King';
    case 'Q':
      return 'Queen';
    case 'B':
      return 'Bishop';
    case 'P':
      return 'Pawn';
    default:
      return type;
  }
};

const RosterPopup = ({ isVisible, onClose, piecePokemonMap, pieces }) => {
  const uniquePieces = new Set();
  const filteredPieces = Object.entries(pieces).filter(([key, piece]) => {
    const uniqueKey = `${piece.type}-${piece.pokemon}`;
    if (uniquePieces.has(uniqueKey)) {
      return false;
    } else {
      uniquePieces.add(uniqueKey);
      return true;
    }
  });

  return (
    <PopupContainer isVisible={isVisible}>
      <Header>
        <Typography variant="h6">Roster</Typography>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </Header>
      <Box>
        {filteredPieces.map(([key, piece]) => (
          <PieceInfo key={key}>
            <Typography variant="body1">{pieceTypeToName(piece.type.charAt(0).toUpperCase())}</Typography>
            <img src={piece.sprite} alt={piece.pokemon} style={{ width: '30px', height: '30px' }} />
            <Typography variant="body1">{piece.pokemon.charAt(0).toUpperCase() + piece.pokemon.slice(1)}</Typography>
            <Typography variant="body1">{piece.pokemonType.charAt(0).toUpperCase() + piece.pokemonType.slice(1)}</Typography>
          </PieceInfo>
        ))}
      </Box>
    </PopupContainer>
  );
};

export default RosterPopup;
