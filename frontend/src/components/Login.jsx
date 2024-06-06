// src/components/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    console.log('Supabase response:', data);
    if (error) {
      setMessage(`Error logging in: ${error.message}`);
    } else if (data?.user && !data.user.email_confirmed_at) {
      setMessage('Please verify your email address before logging in.');
    } else if (data?.user) {
      console.log("User logged in, navigating to game page");
      navigate('/game'); // Redirect to the chessboard page
    } else {
      console.log("hello");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

export default Login;
