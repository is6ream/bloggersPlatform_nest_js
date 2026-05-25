import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import './Header.css';

export function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/blogs" className="app-header-brand">
          Blogger Platform
        </Link>
        <nav className="app-header-nav">
          <Link to="/blogs" className="app-header-link">
            Blogs
          </Link>
          <div className="app-header-auth">
            {isLoading ? null : isAuthenticated && user ? (
              <>
                <Link to="/profile" className="app-header-user">
                  {user.login}
                </Link>
                <button type="button" className="app-header-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="app-header-btn">
                  Sign In
                </Link>
                <Link
                  to="/registration"
                  className="app-header-btn app-header-btn-primary"
                  onClick={() => navigate('/registration')}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
