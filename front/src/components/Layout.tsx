import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { MobileTabBar } from './MobileTabBar';

export function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="app">
      <Header />
      <main className="app__main">
        <div className="page-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
