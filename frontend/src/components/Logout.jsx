import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { logout } from '../supabaseClient';
import PropTypes from 'prop-types';

const Logout = ({ socket, username }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      socket.emit('userLogout', { username });
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <Button variant="contained" color="secondary" onClick={handleLogout}>
      Logout
    </Button>
  );
};

Logout.propTypes = {
  socket: PropTypes.object.isRequired,
  username: PropTypes.string.isRequired,
};

export default Logout;
