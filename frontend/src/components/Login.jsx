import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Container, TextField, Button, Typography, Box } from '@mui/material';
import axios from 'axios';
import { styled, keyframes } from '@mui/system';

const moveAnimation = keyframes`
  0% { transform: translate(0, 0); }
  50% { transform: translate(10px, 10px); }
  100% { transform: translate(0, 0); }
`;

const SpriteBox = styled(Box)({
  width: '100px',
  height: '100px',
  imageRendering: 'pixelated',
  position: 'absolute',
  animation: `${moveAnimation} 5s ease-in-out infinite`,
});

const generateRandomPokemonId = () => Math.floor(Math.random() * 898) + 1;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [sprites, setSprites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSprites = async () => {
      try {
        const promises = [];
        for (let i = 0; i < 5; i++) {
          const id = generateRandomPokemonId();
          promises.push(axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`));
        }
        const responses = await Promise.all(promises);
        const fetchedSprites = responses.map((response) => response.data.sprites.front_default);
        setSprites(fetchedSprites);
      } catch (error) {
        console.error('Error fetching sprites:', error);
      }
    };

    fetchSprites();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });

    console.log('Supabase response:', { error, data });

    if (error) {
      setMessage(`Error logging in: ${error.message}`);
    } else if (data?.user && !data.user.email_confirmed_at) {
      setMessage('Please verify your email address before logging in.');
    } else if (data?.user) {
      navigate('/lobby'); // Redirect to the lobby page
    } else {
      console.log("Login error");
    }
  };

  return (
    <Box sx={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {sprites.map((sprite, index) => (
        <SpriteBox key={index} style={{ top: `${Math.random() * 90}%`, left: `${Math.random() * 90}%` }}>
          <img src={sprite} alt="Pokémon" style={{ width: '100%', height: '100%' }} />
        </SpriteBox>
      ))}
      <Container maxWidth="xs" sx={{ backgroundColor: '#1d1d1d', padding: '20px', borderRadius: '10px' }}>
        <Box textAlign="center" mt={5} position="relative">
          <Typography variant="h3" color="primary" mb={2}>Pokémon Chess</Typography>
          <Typography variant="h4" color="primary">Login</Typography>
          <form onSubmit={handleLogin}>
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
              Login
            </Button>
          </form>
          {message && <Typography color="error">{message}</Typography>}
          <Typography mt={2} color="secondary">
            Don't have an account? <Link to="/signup" style={{ color: '#80d8ff' }}>Sign up</Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
