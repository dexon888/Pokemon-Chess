import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';

const PopupContainer = styled(Box)(({ isVisible }) => ({
  position: 'fixed',
  bottom: isVisible ? '10px' : '-100%',
  left: '10px',
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

const typeEmojiMapping = {
  normal: '⚪️',
  fire: '🔥',
  water: '💧',
  electric: '⚡',
  grass: '🌿',
  ice: '❄️',
  fighting: '🥊',
  poison: '☠️',
  ground: '🌍',
  flying: '🕊️',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '🧚',
};

const TypeEmojiPopup = ({ isVisible, onClose }) => {
  return (
    <PopupContainer isVisible={isVisible}>
      <Header>
        <Typography variant="h6">Type Emoji Mapping</Typography>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </Header>
      <Box>
        {Object.entries(typeEmojiMapping).map(([type, emoji]) => (
          <Box key={type} display="flex" justifyContent="space-between" p={1} borderBottom="1px solid #444">
            <Typography variant="body1">{type.charAt(0).toUpperCase() + type.slice(1)}</Typography>
            <Typography variant="body1">{emoji}</Typography>
          </Box>
        ))}
      </Box>
    </PopupContainer>
  );
};

export default TypeEmojiPopup;
