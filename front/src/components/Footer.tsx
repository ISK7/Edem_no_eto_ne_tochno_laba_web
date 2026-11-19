import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <strong>едем</strong>
          <span>но это не точно</span>
        </div>
        <nav className="footer__nav" aria-label="Навигация в подвале">
          <Link to="/">Главная</Link>
          <Link to="/requests">Мой кабинет</Link>
          <Link to="/requests/new">Новая заявка</Link>
        </nav>
        <p className="footer__note">Учебный проект · тест-драйв без обязательств</p>
      </div>
    </footer>
  );
}
