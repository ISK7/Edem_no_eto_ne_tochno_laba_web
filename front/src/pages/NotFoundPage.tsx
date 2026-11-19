import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';

export function NotFoundPage() {
  return (
    <section className="not-found">
      <span className="not-found__code">404</span>
      <h1>Свернули не туда</h1>
      <p>Такой страницы на портале нет. Вернитесь на главную и продолжите путь.</p>
      <Link className="btn btn--primary btn--lg" to="/">
        <Icon name="arrow-right" size={18} />
        На главную
      </Link>
    </section>
  );
}
