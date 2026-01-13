import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, createPost, updatePost } from '../services/posts';
import { getTags } from '../services/tags';
import MarkdownEditor from '../components/MarkdownEditor';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { Tag } from '../types';

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTags();
    if (id) loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTags = async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (err: any) {
      console.error('Error loading tags:', err);
    }
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const data = await getPost(Number(id));
      setTitle(data.title);
      setContent(data.content);
      setSelectedTags(data.tags?.map((postTag: any) => postTag.tag.id) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, shouldPublish: boolean) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const postData = {
        title,
        content,
        published: shouldPublish,
        tagIds: selectedTags,
      };

      if (id) {
        await updatePost(Number(id), postData);
      } else {
        await createPost(postData);
      }
      
      if (shouldPublish) {
        // Используем window.location для полной перезагрузки и обновления списка постов
        window.location.href = '/';
      } else {
        navigate('/drafts');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  if (loading && id) return <Loading />;

  return (
    <div>
      <h1>{id ? 'Редактировать пост' : 'Создать пост'}</h1>
      {error && <ErrorMessage message={error} />}
      
      <form>
        <div style={fieldStyle}>
          <label style={labelStyle}>Заголовок:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок поста"
            style={inputStyle}
            maxLength={200}
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Теги:</label>
          <div style={tagsContainerStyle}>
            {tags.map((tag) => (
              <label key={tag.id} style={tagLabelStyle}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                  style={checkboxStyle}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Содержание (Markdown):</label>
          <MarkdownEditor value={content} onChange={setContent} />
        </div>

        <div style={buttonsStyle}>
          <button
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading || !title || !content}
            style={saveDraftButtonStyle}
          >
            {loading ? 'Сохранение...' : 'Сохранить черновик'}
          </button>
          <button
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading || !title || !content}
            style={publishButtonStyle}
          >
            {loading ? 'Публикация...' : 'Опубликовать'}
          </button>
        </div>
      </form>
    </div>
  );
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: 'bold',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
};

const tagsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
};

const tagLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  cursor: 'pointer',
};

const checkboxStyle: React.CSSProperties = {
  cursor: 'pointer',
};

const buttonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginTop: '2rem',
};

const saveDraftButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

const publishButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

export default EditorPage;
