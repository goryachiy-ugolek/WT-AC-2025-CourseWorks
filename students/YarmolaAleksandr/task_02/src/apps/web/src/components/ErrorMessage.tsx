import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div style={errorStyle}>
    <strong>Ошибка:</strong> {message}
  </div>
);

const errorStyle: React.CSSProperties = {
  backgroundColor: '#f8d7da',
  color: '#721c24',
  padding: '1rem',
  borderRadius: '4px',
  border: '1px solid #f5c6cb',
  margin: '1rem 0',
};

export default ErrorMessage;
