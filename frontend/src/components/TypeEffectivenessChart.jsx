import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';

const effectivenessData = {
  normal: { superEffective: [], notVeryEffective: ['rock', 'steel'], immune: ['ghost'] },
  fire: { superEffective: ['grass', 'ice', 'bug', 'steel'], notVeryEffective: ['fire', 'water', 'rock', 'dragon'], immune: [] },
  water: { superEffective: ['fire', 'ground', 'rock'], notVeryEffective: ['water', 'grass', 'dragon'], immune: [] },
  electric: { superEffective: ['water', 'flying'], notVeryEffective: ['electric', 'grass', 'dragon'], immune: ['ground'] },
  grass: { superEffective: ['water', 'ground', 'rock'], notVeryEffective: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], immune: [] },
  ice: { superEffective: ['grass', 'ground', 'flying', 'dragon'], notVeryEffective: ['fire', 'water', 'ice', 'steel'], immune: [] },
  fighting: { superEffective: ['normal', 'ice', 'rock', 'dark', 'steel'], notVeryEffective: ['poison', 'flying', 'psychic', 'bug', 'fairy'], immune: ['ghost'] },
  poison: { superEffective: ['grass', 'fairy'], notVeryEffective: ['poison', 'ground', 'rock', 'ghost'], immune: ['steel'] },
  ground: { superEffective: ['fire', 'electric', 'poison', 'rock', 'steel'], notVeryEffective: ['grass', 'bug'], immune: ['flying'] },
  flying: { superEffective: ['grass', 'fighting', 'bug'], notVeryEffective: ['electric', 'rock', 'steel'], immune: ['ground'] },
  psychic: { superEffective: ['fighting', 'poison'], notVeryEffective: ['psychic', 'steel'], immune: ['dark'] },
  bug: { superEffective: ['grass', 'psychic', 'dark'], notVeryEffective: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'], immune: [] },
  rock: { superEffective: ['fire', 'ice', 'flying', 'bug'], notVeryEffective: ['fighting', 'ground', 'steel'], immune: [] },
  ghost: { superEffective: ['psychic', 'ghost'], notVeryEffective: ['dark'], immune: ['normal'] },
  dragon: { superEffective: ['dragon'], notVeryEffective: ['steel'], immune: ['fairy'] },
  dark: { superEffective: ['psychic', 'ghost'], notVeryEffective: ['fighting', 'dark', 'fairy'], immune: [] },
  steel: { superEffective: ['ice', 'rock', 'fairy'], notVeryEffective: ['fire', 'water', 'electric', 'steel'], immune: ['poison'] },
  fairy: { superEffective: ['fighting', 'dragon', 'dark'], notVeryEffective: ['fire', 'poison', 'steel'], immune: ['dragon'] },
};

const TableHeaderCell = styled(TableCell)({
  backgroundColor: '#3b4cca',
  color: '#ffcb05',
  fontWeight: 'bold',
  textAlign: 'center',
});

const TableCellEffectiveness = styled(TableCell)({
  textAlign: 'center',
});

const PopupContainer = styled(Box)(({ theme, isVisible }) => ({
  position: 'fixed',
  bottom: isVisible ? '10px' : '-100%',
  right: '10px',
  width: '80%',
  maxHeight: '80vh',
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

const TypeEffectivenessChart = ({ isVisible, onClose }) => {
  const types = Object.keys(effectivenessData);

  return (
    <PopupContainer isVisible={isVisible}>
      <Header>
        <Typography variant="h6">Type Effectiveness Chart</Typography>
        <IconButton onClick={onClose} color="inherit">
          <CloseIcon />
        </IconButton>
      </Header>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell />
              {types.map((type) => (
                <TableHeaderCell key={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {types.map((attackingType) => (
              <TableRow key={attackingType}>
                <TableHeaderCell>{attackingType.charAt(0).toUpperCase() + attackingType.slice(1)}</TableHeaderCell>
                {types.map((defendingType) => (
                  <TableCellEffectiveness key={defendingType}>
                    {isSuperEffective(attackingType, defendingType) ? '2x' :
                      isNotVeryEffective(attackingType, defendingType) ? '0.5x' :
                        effectivenessData[attackingType].immune.includes(defendingType) ? '0x' :
                          '1x'}
                  </TableCellEffectiveness>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </PopupContainer>
  );
};

const isSuperEffective = (attackingType, defendingType) => {
  return effectivenessData[attackingType]?.superEffective.includes(defendingType);
};

const isNotVeryEffective = (attackingType, defendingType) => {
  return effectivenessData[attackingType]?.notVeryEffective.includes(defendingType);
};

export default TypeEffectivenessChart;
