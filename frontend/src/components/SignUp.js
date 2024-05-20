import React, { useState } from 'react';
import axios from 'axios';
import { startRegistration } from '@simplewebauthn/browser';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const optionsResponse = await axios.post('http://localhost:5000/api/users/generate-registration-options', { username });
      const attestation = await startRegistration(optionsResponse.data);
      const verificationResponse = await axios.post('http://localhost:5000/api/users/verify-registration', { username, attestation });
      if (verificationResponse.data.verified) {
        setMessage('Sign-up successful');
      } else {
        setMessage('Sign-up failed');
      }
    } catch (error) {
      console.error(error);
      setMessage('Error during sign-up');
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default SignUp;
