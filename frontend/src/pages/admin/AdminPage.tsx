import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';

const tabs = [
  { to: '/admin/blogs', label: 'Блоги' },
  { to: '/admin/posts', label: 'Посты' },
  { to: '/admin/users', label: 'Пользователи' },
];

export function AdminPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner className="py-20" />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Панель администратора</h1>

      <nav className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1">
        {tabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors ${
                isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
