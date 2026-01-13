import api from './api';

export const addComment = async (postId: number, content: string) => {
  const response = await api.post('/comments', { postId, content });
  return response.data;
};

export const deleteComment = async (id: number) => {
  const response = await api.delete(`/comments/${id}`);
  return response.data;
};
