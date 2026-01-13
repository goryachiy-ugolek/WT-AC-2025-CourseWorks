import React, { useEffect, useState } from 'react';
import { getTags, createTag, deleteTag } from '../services/tags';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import { Tag } from '../types';

const TagManager: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await getTags();
      setTags(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await createTag({ name: newTagName });
      setNewTagName('');
      loadTags();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этот тег?')) return;
    try {
      await deleteTag(id);
      loadTags();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h2>Управление тегами</h2>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleCreate} style={formStyle}>
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Название нового тега"
          style={inputStyle}
          maxLength={50}
        />
        <button type="submit" style={buttonStyle}>
          Создать
        </button>
      </form>
      <div style={tagsListStyle}>
        {tags.map((tag) => (
          <div key={tag.id} style={tagItemStyle}>
            <span>{tag.name}</span>
            <button onClick={() => handleDelete(tag.id)} style={deleteButtonStyle}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1.5rem',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const tagsListStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const tagItemStyle: React.CSSProperties = {
  backgroundColor: '#e3f2fd',
  color: '#1976d2',
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const deleteButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#d32f2f',
  cursor: 'pointer',
  fontSize: '1.2rem',
};

export default TagManager;
