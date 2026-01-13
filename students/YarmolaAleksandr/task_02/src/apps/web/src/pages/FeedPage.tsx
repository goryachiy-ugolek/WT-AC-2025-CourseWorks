import React, { useEffect, useState } from 'react';
import { getPosts } from '../services/posts';
import { getTags } from '../services/tags';
import PostList from '../components/PostList';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { Post, Tag } from '../types';

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    console.log('[FeedPage] loadPosts triggered - page:', page, 'tag:', selectedTag, 'search:', search);
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedTag, search]);

  const loadTags = async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (err: any) {
      console.error('Error loading tags:', err);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params: any = { page, published: 'true' };
      if (selectedTag) params.tag = selectedTag;
      if (search) params.search = search;
      
      console.log('[FeedPage] Loading posts with params:', params);
      const data = await getPosts(params);
      console.log('[FeedPage] Loaded posts:', data.posts?.length, 'posts, totalPages:', data.totalPages);
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('[FeedPage] Error loading posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  return (
    <div>
      <h1>Лента постов</h1>
      
      {/* Поиск */}
      <form onSubmit={handleSearch} style={searchFormStyle} role="search" aria-label="Поиск постов">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск постов..."
          style={searchInputStyle}
          aria-label="Введите текст для поиска"
        />
        <button type="submit" style={searchButtonStyle} aria-label="Искать посты">
          Искать
        </button>
      </form>

      {/* Фильтр по тегам */}
      {tags.length > 0 && (
        <div style={filterStyle}>
          <label htmlFor="tag-filter">Фильтр по тегу: </label>
          <select
            id="tag-filter"
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              setPage(1);
            }}
            style={selectStyle}
            aria-label="Выберите тег для фильтрации"
          >
            <option value="">Все</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Список постов */}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <PostList posts={posts} />
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
};

const searchFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
};

const searchButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const filterStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const selectStyle: React.CSSProperties = {
  padding: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
};

export default FeedPage;
