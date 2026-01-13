import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Post } from '../types';

interface PostViewProps {
  post: Post;
}

const PostView: React.FC<PostViewProps> = ({ post }) => {
  return (
    <article style={articleStyle} aria-labelledby="post-title">
      <h1 id="post-title" style={titleStyle}>{post.title}</h1>
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
      <div style={contentStyle} role="article" aria-label="Содержание поста">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
};

const articleStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 1rem 0',
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
  margin: '1rem 0',
};

const tagStyle: React.CSSProperties = {
  backgroundColor: '#e3f2fd',
  color: '#1976d2',
  padding: '0.25rem 0.75rem',
  borderRadius: '12px',
  fontSize: '0.85rem',
};

const contentStyle: React.CSSProperties = {
  lineHeight: '1.8',
  color: '#333',
  marginTop: '2rem',
};

export default PostView;
