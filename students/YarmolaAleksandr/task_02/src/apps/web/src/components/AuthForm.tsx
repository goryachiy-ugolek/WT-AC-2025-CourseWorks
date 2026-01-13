import React, { useState } from 'react';

interface AuthFormProps {
  onSubmit: (data: { email: string; password: string; name?: string }) => void;
  isLogin: boolean;
  error?: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, isLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password, name: isLogin ? undefined : name });
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle} aria-label={isLogin ? 'Форма входа' : 'Форма регистрации'}>
      <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
      {error && <div style={errorStyle} role="alert" aria-live="polite">{error}</div>}
      {!isLogin && (
        <div style={fieldStyle}>
          <label htmlFor="name-input">Имя:</label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
            aria-label="Введите ваше имя"
          />
        </div>
      )}
      <div style={fieldStyle}>
        <label htmlFor="email-input">Email:</label>
        <input
          id="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
          aria-label="Введите email"
        />
      </div>
      <div style={fieldStyle}>
        <label htmlFor="password-input">Пароль:</label>
        <input
          id="password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={inputStyle}
          aria-label="Введите пароль (минимум 6 символов)"
          aria-describedby="password-hint"
        />
        <small id="password-hint" style={{ fontSize: '0.85rem', color: '#666' }}>
          Минимум 6 символов
        </small>
      </div>
      <button type="submit" style={buttonStyle} aria-label={isLogin ? 'Войти в систему' : 'Зарегистрироваться'}>
        {isLogin ? 'Войти' : 'Зарегистрироваться'}
      </button>
    </form>
  );
};

const formStyle: React.CSSProperties = {
  maxWidth: '400px',
  margin: '2rem auto',
  padding: '2rem',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '1rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '1rem',
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  backgroundColor: '#f8d7da',
  color: '#721c24',
  padding: '0.75rem',
  borderRadius: '4px',
  marginBottom: '1rem',
};

export default AuthForm;
