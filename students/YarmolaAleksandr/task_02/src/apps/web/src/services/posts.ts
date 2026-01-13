import api from './api';

interface GetPostsParams {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
  published?: string;
}

export const getPosts = async (params: GetPostsParams = {}) => {
  const response = await api.get('/posts', { params });
  return response.data;
};

export const getPost = async (id: number) => {
  const response = await api.get(`/posts/${id}`);
  return response.data;
};

export const createPost = async (data: {
  title: string;
  content: string;
  published: boolean;
  tagIds?: number[];
}) => {
  const response = await api.post('/posts', data);
  return response.data;
};

export const updatePost = async (
  id: number,
  data: {
    title?: string;
    content?: string;
    published?: boolean;
    tagIds?: number[];
  }
) => {
  const response = await api.put(`/posts/${id}`, data);
  return response.data;
};

export const deletePost = async (id: number) => {
  const response = await api.delete(`/posts/${id}`);
  return response.data;
};
