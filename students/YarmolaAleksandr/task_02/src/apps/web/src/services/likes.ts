import api from './api';

export const toggleLike = async (postId: number) => {
  const response = await api.post('/likes/toggle', { postId });
  return response.data;
};

export const getLikes = async (postId: number) => {
  const response = await api.get(`/likes/post/${postId}`);
  return response.data;
};
