import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/format';
import { Icon } from './Icon';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="brand" aria-label="Едем, но это не точно — на главную">
          <span className="brand__mark">
            <Icon name="car" size={22} />
          </span>
          <span className="brand__text">
            <strong>едем</strong>
            <small>но это не точно</small>
          </span>
        </Link>

        <nav className="header__nav" aria-label="Основная навигация">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
            Главная
          </NavLink>
          {user && (
            <NavLink
              to="/requests"
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              Мой кабинет
            </NavLink>
          )}
          {user && (
            <NavLink
              to="/requests/new"
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              Новая заявка
            </NavLink>
          )}
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'is-active' : '')}>
              Админ-панель
            </NavLink>
          )}
        </nav>

        <div className="header__auth">
          {user ? (
            <>
              <div className="user-chip" title={user.fullName}>
                <span className="avatar">{initials(user.fullName)}</span>
                <span className="user-chip__text">
                  <strong>{user.fullName.split(' ').slice(0, 2).join(' ')}</strong>
                  <small>{user.role === 'ADMIN' ? 'Администратор' : 'Заказчик'}</small>
                </span>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Выйти из аккаунта"
                title="Выйти"
              >
                <Icon name="logout" size={20} />
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn--ghost btn--sm" to="/login">
                Войти
              </Link>
              <Link className="btn btn--primary btn--sm" to="/register">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
