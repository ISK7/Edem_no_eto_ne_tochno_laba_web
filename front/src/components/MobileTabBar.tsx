import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon, type IconName } from './Icon';

interface TabItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
}

export function MobileTabBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items: TabItem[] = user
    ? user.role === 'ADMIN'
      ? [
          { to: '/', label: 'Главная', icon: 'car', end: true },
          { to: '/admin', label: 'Панель', icon: 'shield' },
          { to: '/requests', label: 'Кабинет', icon: 'calendar' },
        ]
      : [
          { to: '/', label: 'Главная', icon: 'car', end: true },
          { to: '/requests', label: 'Кабинет', icon: 'calendar' },
          { to: '/requests/new', label: 'Заявка', icon: 'plus' },
        ]
    : [
        { to: '/', label: 'Главная', icon: 'car', end: true },
        { to: '/login', label: 'Войти', icon: 'key' },
        { to: '/register', label: 'Регистрация', icon: 'user' },
      ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="tabbar" aria-label="Мобильная навигация">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `tabbar__item ${isActive ? 'is-active' : ''}`}
        >
          <Icon name={item.icon} size={21} />
          <span>{item.label}</span>
        </NavLink>
      ))}
      {user && (
        <button type="button" className="tabbar__item" onClick={handleLogout}>
          <Icon name="logout" size={21} />
          <span>Выйти</span>
        </button>
      )}
    </nav>
  );
}
