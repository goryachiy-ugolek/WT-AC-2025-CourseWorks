import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <div>
      <nav style={navStyle} aria-label="Основная навигация">
        <div style={navContentStyle}>
          <Link to="/" style={brandStyle} aria-label="Главная страница Longread Blog">
            Longread Blog
          </Link>
          <div style={navLinksStyle}>
            <Link to="/" style={linkStyle} aria-label="Перейти к ленте постов">Лента</Link>
            {user ? (
              <>
                <Link to="/editor" style={linkStyle} aria-label="Создать новый пост">Создать пост</Link>
                <Link to="/drafts" style={linkStyle} aria-label="Просмотреть черновики">Черновики</Link>
                {user.role === 'admin' && (
                  <>
                    <Link to="/tags" style={linkStyle} aria-label="Управление тегами">Теги</Link>
                    <Link to="/admin/users" style={linkStyle} aria-label="Управление пользователями">Пользователи</Link>
                  </>
                )}
                <span style={userNameStyle} aria-label={`Текущий пользователь: ${user.name}`}>{user.name}</span>
                <button onClick={handleLogout} style={logoutButtonStyle} aria-label="Выйти из аккаунта">
                  Выход
                </button>
              </>
            ) : (
              <Link to="/login" style={linkStyle} aria-label="Войти в аккаунт">Вход</Link>
            )}
          </div>
        </div>
      </nav>
      <main style={mainStyle} role="main">{children}</main>
    </div>
  );
};

const navStyle: React.CSSProperties = {
  backgroundColor: '#333',
  color: 'white',
  padding: '1rem 0',
  marginBottom: '2rem',
};

const navContentStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 1rem',
};

const brandStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: 'white',
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'center',
};

const linkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
};

const userNameStyle: React.CSSProperties = {
  color: '#ddd',
};

const logoutButtonStyle: React.CSSProperties = {
  backgroundColor: '#d9534f',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
};

const mainStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 1rem',
};

export default Layout;
