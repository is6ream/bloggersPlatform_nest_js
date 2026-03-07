import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          Blogger
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink
            to="/blogs"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Блоги
          </NavLink>
          {user && (
            <>
              <NavLink
                to="/security/devices"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Устройства
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Админ
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:block">
                {user.login}
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Войти
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Регистрация
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
