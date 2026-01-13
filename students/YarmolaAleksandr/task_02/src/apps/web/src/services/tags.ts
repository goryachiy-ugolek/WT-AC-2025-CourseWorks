import api from './api';

export const getTags = async () => {
  const response = await api.get('/tags');
  return response.data;
};

export const createTag = async (data: { name: string }) => {
  const response = await api.post('/tags', data);
  return response.data;
};

export const deleteTag = async (id: number) => {
  const response = await api.delete(`/tags/${id}`);
  return response.data;
};
