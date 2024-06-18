import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Container, TextField, Button, Typography, Box } from '@mui/material';
import axios from 'axios';
import { styled, keyframes } from '@mui/system';

const bounceAnimation = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const ChessPieceBox = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  margin: '20px 0',
});

const PieceContainer = styled(Box)({
  width: '100px', // Increased size
  height: '100px', // Increased size
  position: 'relative',
  margin: '0 10px',
});

const ChessPiece = styled('img')({
  width: '100%',
  height: '100%',
});

const PokemonSprite = styled('img')({
  width: '70%', // Increased size
  height: '70%', // Increased size
  position: 'absolute',
  top: '15%',
  left: '15%',
  animation: `${bounceAnimation} 1s ease-in-out infinite`, // Added animation
});

const pieceOrder = ['p', 'r', 'n', 'b', 'q', 'k', 'b', 'n', 'r', 'p'];

const generateRandomPokemonId = () => Math.floor(Math.random() * 898) + 1;

const getSymmetricalPokemonMap = async () => {
  let symmetricalMap = {};
  let pokemonIds = {};

  for (let i = 0; i < pieceOrder.length / 2; i++) {
    let pokemonId = generateRandomPokemonId();
    pokemonIds[pieceOrder[i]] = pokemonId;
    pokemonIds[pieceOrder[pieceOrder.length - 1 - i]] = pokemonId;
  }

  const promises = Object.keys(pokemonIds).map((piece) => axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonIds[piece]}`));
  const responses = await Promise.all(promises);

  responses.forEach((response, index) => {
    symmetricalMap[pieceOrder[index]] = response.data.sprites.front_default;
    symmetricalMap[pieceOrder[pieceOrder.length - 1 - index]] = response.data.sprites.front_default;
  });

  return symmetricalMap;
};

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [pokemonSprites, setPokemonSprites] = useState({});

  useEffect(() => {
    const fetchSprites = async () => {
      try {
        const symmetricalMap = await getSymmetricalPokemonMap();
        setPokemonSprites(symmetricalMap);
      } catch (error) {
        console.error('Error fetching sprites:', error);
      }
    };

    fetchSprites();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');

    const { error, user } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(`Error signing up: ${error.message}`);
    } else {
      setMessage('Signup successful! Please check your email for verification.');
    }
  };

  return (
    <Box sx={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexDirection: 'column' }}>
      <Container maxWidth="xs" sx={{ backgroundColor: '#1d1d1d', padding: '20px', borderRadius: '10px', mb: 4 }}>
        <Box textAlign="center" mt={5} position="relative">
          <Typography variant="h3" color="primary" mb={2}>Pokémon Chess</Typography>
          <Typography variant="h4" color="primary">Sign Up</Typography>
          <form onSubmit={handleSignup}>
            <TextField
              fullWidth
              margin="normal"
              variant="outlined"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              color="secondary"
              sx={{ backgroundColor: '#333', borderRadius: '5px' }}
              InputLabelProps={{ style: { color: '#fff' } }}
              InputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              fullWidth
              margin="normal"
              variant="outlined"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              color="secondary"
              sx={{ backgroundColor: '#333', borderRadius: '5px' }}
              InputLabelProps={{ style: { color: '#fff' } }}
              InputProps={{ style: { color: '#fff' } }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 2 }}
            >
              Sign Up
            </Button>
          </form>
          {message && <Typography color="error">{message}</Typography>}
          <Typography mt={2} color="secondary">
            Already have an account? <Link to="/login" style={{ color: '#80d8ff' }}>Login</Link>
          </Typography>
        </Box>
      </Container>
      <ChessPieceBox>
        {pieceOrder.map((piece, index) => (
          <PieceContainer key={index}>
            <ChessPiece src={`/chess-pieces/white-${piece}.png`} alt={piece} />
            {pokemonSprites[piece] && <PokemonSprite src={pokemonSprites[piece]} alt={`pokemon-${piece}`} />}
          </PieceContainer>
        ))}
      </ChessPieceBox>
    </Box>
  );
};

export default Signup;
