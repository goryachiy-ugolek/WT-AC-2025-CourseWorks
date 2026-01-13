import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, deletePost } from '../services/posts';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import { Post } from '../types';

const DraftsList: React.FC = () => {
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const data = await getPosts({ published: 'false' });
      setDrafts(data.posts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этот черновик?')) return;
    try {
      await deletePost(id);
      loadDrafts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h2>Мои черновики</h2>
      {drafts.length === 0 ? (
        <p>У вас пока нет черновиков</p>
      ) : (
        drafts.map((draft) => (
          <div key={draft.id} style={draftCardStyle}>
            <h3>{draft.title || 'Без названия'}</h3>
            <p>{new Date(draft.createdAt).toLocaleDateString()}</p>
            <div style={actionsStyle}>
              <Link to={`/editor/${draft.id}`} style={editButtonStyle}>
                Редактировать
              </Link>
              <button onClick={() => handleDelete(draft.id)} style={deleteButtonStyle}>
                Удалить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const draftCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '1rem',
  marginBottom: '1rem',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginTop: '1rem',
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

export default DraftsList;
