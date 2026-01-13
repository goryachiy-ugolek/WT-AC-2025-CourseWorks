import api from './api';

export const login = async (data: { email: string; password: string }) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const register = async (data: { email: string; password: string; name: string }) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
