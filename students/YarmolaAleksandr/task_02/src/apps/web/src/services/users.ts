import api from './api';

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const updateUserRole = async (id: number, role: string) => {
  const response = await api.put(`/users/${id}`, { role });
  return response.data;
};

export const deleteUser = async (id: number) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
