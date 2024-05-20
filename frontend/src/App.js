import React from 'react';
import SignUp from './components/SignUp';
import Login from './components/Login';

const App = () => {
  return (
    <div>
      <h1>Biometric Auth App</h1>
      <SignUp />
      <Login />
    </div>
  );
};

export default App;
