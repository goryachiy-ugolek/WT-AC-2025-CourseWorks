import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost, deletePost } from '../services/posts';
import { addComment, deleteComment } from '../services/comments';
import { toggleLike } from '../services/likes';
import PostView from '../components/PostView';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { Post, Comment, User } from '../types';

const PostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('userData');
      }
    }
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Обновляем user при изменении localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (err) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadPost = async () => {
    try {
      setLoading(true);
      const data = await getPost(Number(id));
      setPost(data);
      setComments(data.comments || []);
      setLikeCount(data._count?.likes || 0);
      setIsLiked(data.isLiked || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      console.log('User not found, redirecting to login');
      navigate('/login');
      return;
    }
    try {
      console.log('Adding comment for post:', id, 'user:', user.id, 'comment:', newComment);
      await addComment(Number(id), newComment);
      setNewComment('');
      await loadPost();
      console.log('Comment added successfully');
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Удалить этот комментарий?')) return;
    try {
      await deleteComment(commentId);
      loadPost();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      console.log('User not found, redirecting to login');
      navigate('/login');
      return;
    }
    try {
      console.log('Toggling like for post:', id, 'user:', user.id);
      const result = await toggleLike(Number(id));
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
      console.log('Like toggled successfully:', result);
    } catch (err: any) {
      console.error('Error toggling like:', err);
      setError(err.message);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Удалить этот пост?')) return;
    try {
      await deletePost(Number(id));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!post) return <ErrorMessage message="Пост не найден" />;

  const canEdit = user && (user.id === post.authorId || user.role === 'admin');

  return (
    <div>
      {canEdit && (
        <div style={actionsStyle} role="toolbar" aria-label="Действия с постом">
          <Link to={`/editor/${post.id}`} style={editButtonStyle} aria-label="Редактировать пост">
            Редактировать
          </Link>
          <button onClick={handleDeletePost} style={deleteButtonStyle} aria-label="Удалить пост">
            Удалить
          </button>
        </div>
      )}
      
      <PostView post={post} />

      {/* Лайки */}
      <div style={likesSectionStyle}>
        <button 
          onClick={handleToggleLike} 
          style={likeButtonStyle}
          aria-label={isLiked ? `Убрать лайк. Всего лайков: ${likeCount}` : `Поставить лайк. Всего лайков: ${likeCount}`}
        >
          {isLiked ? '❤️' : '🤍'} {likeCount}
        </button>
      </div>

      {/* Комментарии */}
      <section style={commentsSectionStyle} aria-labelledby="comments-heading">
        <h3 id="comments-heading">Комментарии ({comments.length})</h3>
        
        {user && (
          <form onSubmit={handleAddComment} style={commentFormStyle} aria-label="Добавить комментарий">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написать комментарий..."
              style={commentInputStyle}
              aria-label="Текст комментария"
            />
            <button type="submit" style={submitButtonStyle} aria-label="Отправить комментарий">
              Отправить
            </button>
          </form>
        )}

        <div style={commentsListStyle}>
          {comments.map((comment) => (
            <article key={comment.id} style={commentCardStyle} aria-labelledby={`comment-${comment.id}`}>
              <div style={commentHeaderStyle}>
                <strong id={`comment-${comment.id}`}>{comment.author.name}</strong>
                <span style={commentDateStyle}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={commentTextStyle}>{comment.content}</p>
              {user && (user.id === comment.authorId || user.role === 'admin') && (
                <button 
                  onClick={() => handleDeleteComment(comment.id)} 
                  style={deleteCommentButtonStyle}
                  aria-label={`Удалить комментарий от ${comment.author.name}`}
                >
                  Удалить
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1rem',
};

const editButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#007bff',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '4px',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const likesSectionStyle: React.CSSProperties = {
  marginTop: '2rem',
};

const likeButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  fontSize: '1.2rem',
  backgroundColor: 'white',
  border: '2px solid #ddd',
  borderRadius: '25px',
  cursor: 'pointer',
};

const commentsSectionStyle: React.CSSProperties = {
  marginTop: '3rem',
};

const commentFormStyle: React.CSSProperties = {
  marginBottom: '2rem',
};

const commentInputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '80px',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  marginBottom: '0.5rem',
  fontSize: '1rem',
  resize: 'vertical',
};

const submitButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const commentsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const commentCardStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '1rem',
  borderRadius: '4px',
};

const commentHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem',
};

const commentDateStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.9rem',
};

const commentTextStyle: React.CSSProperties = {
  margin: '0.5rem 0',
  lineHeight: '1.6',
};

const deleteCommentButtonStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

export default PostPage;
