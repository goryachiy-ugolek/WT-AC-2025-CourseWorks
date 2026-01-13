import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav style={containerStyle} aria-label="Навигация по страницам">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={buttonStyle}
        aria-label="Перейти на предыдущую страницу"
      >
        Предыдущая
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            ...buttonStyle,
            ...(page === currentPage ? activeButtonStyle : {}),
          }}
          aria-label={`Перейти на страницу ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={buttonStyle}
        aria-label="Перейти на следующую страницу"
      >
        Следующая
      </button>
    </nav>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  justifyContent: 'center',
  margin: '2rem 0',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  cursor: 'pointer',
  borderRadius: '4px',
};

const activeButtonStyle: React.CSSProperties = {
  backgroundColor: '#007bff',
  color: 'white',
  borderColor: '#007bff',
};

export default Pagination;
