import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context";

export const Layout = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            ✈️ Поехали!
          </Link>

          <nav className="nav">
            {isAuthenticated ? (
              <>
                <Link to="/trips" className="nav-link">
                  Мои поездки
                </Link>
                <div className="user-info">
                  <span>
                    {user?.username}
                    {isAdmin && <span className="badge badge-admin" style={{ marginLeft: 8 }}>admin</span>}
                  </span>
                  <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                    Выйти
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Вход
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
