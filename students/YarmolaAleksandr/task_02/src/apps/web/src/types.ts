// Типы для всего frontend приложения

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: number;
  author: {
    id: number;
    name: string;
    email?: string;
  };
  tags: PostTag[];
  comments?: Comment[];
  _count?: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

export interface PostTag {
  id: number;
  tag: Tag;
  tagId?: number;
  name?: string;
}

export interface Tag {
  id: number;
  name: string;
  _count?: {
    posts: number;
  };
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  postId: number;
  authorId: number;
  author: {
    id: number;
    name: string;
  };
}

export interface Like {
  id: number;
  postId: number;
  userId: number;
  user?: {
    id: number;
    name: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totalPages: number;
}
