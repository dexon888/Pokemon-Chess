// src/components/Logout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../supabaseClient';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <button onClick={handleLogout}>Logout</button>
  );
};

export default Logout;
