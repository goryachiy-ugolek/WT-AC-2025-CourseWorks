import React from 'react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Загрузка...' }) => (
  <div style={containerStyle}>
    <div style={spinnerStyle}></div>
    <p>{message}</p>
  </div>
);

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
};

const spinnerStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  border: '5px solid #f3f3f3',
  borderTop: '5px solid #333',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

export default Loading;
