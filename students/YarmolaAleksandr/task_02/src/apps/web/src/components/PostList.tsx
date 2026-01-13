import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../types';

interface PostListProps {
  posts: Post[];
}

const PostList: React.FC<PostListProps> = ({ posts }) => {
  if (posts.length === 0) {
    return <p style={noPostsStyle}>Постов пока нет</p>;
  }

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id} style={postCardStyle} aria-labelledby={`post-title-${post.id}`}>
          <Link to={`/post/${post.id}`} style={titleLinkStyle}>
            <h2 id={`post-title-${post.id}`} style={titleStyle}>{post.title}</h2>
          </Link>
          <p style={metaStyle}>
            Автор: {post.author.name} | {new Date(post.createdAt).toLocaleDateString()}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div style={tagsContainerStyle} aria-label="Теги поста">
              {post.tags.map((postTag) => (
                <span key={postTag.id} style={tagStyle}>
                  {postTag.tag.name}
                </span>
              ))}
            </div>
          )}
          <p style={excerptStyle}>
            {post.content.substring(0, 200)}
            {post.content.length > 200 ? '...' : ''}
          </p>
          {post._count && (
            <p style={statsStyle} aria-label={`${post._count.likes} лайков и ${post._count.comments} комментариев`}>
              ❤️ {post._count.likes} | 💬 {post._count.comments}
            </p>
          )}
        </article>
      ))}
    </div>
  );
};

const postCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '1.5rem',
  marginBottom: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const titleLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.5rem 0',
  color: '#333',
};

const metaStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.9rem',
  margin: '0.5rem 0',
};

const tagsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  margin: '0.5rem 0',
};

const tagStyle: React.CSSProperties = {
  backgroundColor: '#e3f2fd',
  color: '#1976d2',
  padding: '0.25rem 0.75rem',
  borderRadius: '12px',
  fontSize: '0.85rem',
};

const excerptStyle: React.CSSProperties = {
  color: '#555',
  lineHeight: '1.6',
  margin: '1rem 0',
};

const statsStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '0.9rem',
};

const noPostsStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#999',
  padding: '2rem',
};

export default PostList;
