import React, { useState } from 'react';
import axios from 'axios';
import { startAuthentication } from '@simplewebauthn/browser';

const Login = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const optionsResponse = await axios.post('http://localhost:5000/api/users/generate-authentication-options', { username });
      const assertion = await startAuthentication(optionsResponse.data);
      const verificationResponse = await axios.post('http://localhost:5000/api/users/verify-authentication', { username, assertion });
      if (verificationResponse.data.verified) {
        setMessage('Login successful');
      } else {
        setMessage('Login failed');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error during login');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
