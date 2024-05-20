import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

export const signUp = async (username) => {
  const response = await axios.post(`${API_URL}/signup`, { username });
  return response.data;
};

export const login = async (username) => {
  const response = await axios.post(`${API_URL}/login`, { username });
  return response.data;
};
