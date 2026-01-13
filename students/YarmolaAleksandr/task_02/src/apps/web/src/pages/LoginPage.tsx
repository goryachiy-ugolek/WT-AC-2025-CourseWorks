import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/auth';
import AuthForm from '../components/AuthForm';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (data: { email: string; password: string; name?: string }) => {
    try {
      setError('');
      const result = isLogin 
        ? await login({ email: data.email, password: data.password }) 
        : await register({ email: data.email, password: data.password, name: data.name || '' });
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      navigate('/');
      window.location.reload(); // Перезагрузка для обновления Layout
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <AuthForm onSubmit={handleSubmit} isLogin={isLogin} error={error} />
      <div style={switchStyle}>
        <button onClick={() => setIsLogin(!isLogin)} style={switchButtonStyle}>
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
};

const switchStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '1rem',
};

const switchButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#007bff',
  border: 'none',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: '1rem',
};

export default LoginPage;
