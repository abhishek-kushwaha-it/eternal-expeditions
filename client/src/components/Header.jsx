import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Image, Button } from '../core-components';
import { useAuth } from '../hooks/useAuth';
import { useLogoutMutation } from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import { IMAGE_URL } from '../utils/api';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const logoutMutation = useLogoutMutation();
  const { addToast } = useToasts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
      addToast('Logged out successfully!', 'success');
      setMobileMenuOpen(false);
    } catch {
      addToast('Error logging out', 'error');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (loading) {
    return (
      <header className="header">
        <div className="header__left">
          <div className="header__logo">
            <Image
              src="/img/logo-header.png"
              alt="Eternal-Expeditions Logo"
              className="logo-image"
            />
            <span className="logo-text">Eternal-Expeditions</span>
          </div>
        </div>
        <span className="loading-text">Loading...</span>
      </header>
    );
  }

  return (
    <header className="header">
      {/* LEFT SECTION: Logo & Company Name */}
      <div className="header__left">
        <Link to="/" className="header__logo">
          <Image src="/img/logo-header.png" alt="Eternal-Expeditions Logo" className="logo-image" />
          <span className="logo-text">Eternal-Expeditions</span>
        </Link>
      </div>

      {/* CENTER SECTION: Navigation Menu */}
      <nav className={`header__nav ${mobileMenuOpen ? 'header__nav--active' : ''}`}>
        <Link to="/" className="nav__link">
          Home
        </Link>
        <Link to="/tours" className="nav__link">
          Tours
        </Link>
        <Link to="/monthly-plan" className="nav__link">
          Monthly Plan
        </Link>
        <Link to="/contact" className="nav__link">
          Contact
        </Link>
      </nav>

      {/* RIGHT SECTION: Profile & Auth Buttons */}
      <div className="header__right">
        <Button
          type="button"
          variant="ghost"
          className="header__menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </Button>

        <div className="header__auth">
          {isAuthenticated && user ? (
            <div className="user-section">
              <Link to="/me" className="user-profile">
                <Image
                  src={`${IMAGE_URL}/users/${user.photo}?t=${user.updatedAt}`}
                  alt={user.name}
                  className="user-avatar"
                />
                <span className="user-name">{user.name.split(' ')[0]}</span>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="logout-btn"
              >
                {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
              </Button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav__link nav__link--login">
                Log in
              </Link>
              <Link to="/signup" className="nav__link nav__link--signup">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="header__mobile-menu">
          <Link to="/" className="nav__link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/tours" className="nav__link" onClick={() => setMobileMenuOpen(false)}>
            Tours
          </Link>
          <Link to="/monthly-plan" className="nav__link" onClick={() => setMobileMenuOpen(false)}>
            Monthly Plan
          </Link>
          <Link to="/contact" className="nav__link" onClick={() => setMobileMenuOpen(false)}>
            Contact
          </Link>
          {!isAuthenticated && (
            <>
              <Link to="/login" className="nav__link" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link
                to="/signup"
                className="nav__link nav__link--button-block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
