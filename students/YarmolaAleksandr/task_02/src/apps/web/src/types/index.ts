export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Tag {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
  createdAt: string;
  authorId: number;
  author: {
    id: number;
    name: string;
  };
  tags: Tag[];
  _count?: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
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

export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}
