import { Suspense, lazy, useCallback, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Image, Button } from '../core-components';
import { useAuth } from '../hooks/useAuth';
import { useLogoutMutation } from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import { IMAGE_URL } from '../utils/api';
import styles from './Header.module.css';

const EternalAIAssistant = lazy(() => import('./EternalAIAssistant'));

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const logoutMutation = useLogoutMutation();
  const { addToast } = useToasts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const closeAssistant = useCallback(() => setAssistantOpen(false), []);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
      setAssistantOpen(false);
      addToast('Logged out successfully!', 'success');
      setMobileMenuOpen(false);
    } catch {
      addToast('Error logging out', 'error');
    }
  };

  const assistantButton = (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className={styles['assistant-toggle']}
      onClick={() => setAssistantOpen((isOpen) => !isOpen)}
      aria-expanded={assistantOpen}
      aria-controls="eternal-ai-assistant"
      aria-label={assistantOpen ? 'Close Eternal AI Assistant' : 'Open Eternal AI Assistant'}
      title="Eternal AI Assistant"
    >
      <span className={styles['assistant-toggle__sparkle']} aria-hidden="true">
        ✦
      </span>
      AI Assistant
    </Button>
  );

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={styles.header}>
      {/* LEFT SECTION: Logo & Company Name */}
      <div className={styles['header__left']}>
        <Link to="/" className={styles['header__logo']}>
          <Image
            src="/img/logo-header.png"
            alt="Eternal-Expeditions Logo"
            className={styles['logo-image']}
          />
          <span className={styles['logo-text']}>Eternal-Expeditions</span>
        </Link>
      </div>

      {/* CENTER SECTION: Navigation Menu */}
      <nav
        id="primary-navigation"
        className={`${styles['header__nav']} ${mobileMenuOpen ? styles['header__nav--active'] : ''}`}
      >
        <Link to="/" className={styles['nav__link']}>
          Home
        </Link>
        <Link to="/tours" className={styles['nav__link']}>
          Tours
        </Link>
        <Link to="/monthly-plan" className={styles['nav__link']}>
          Monthly Plan
        </Link>
        <Link to="/contact" className={styles['nav__link']}>
          Contact
        </Link>
      </nav>

      {/* RIGHT SECTION: Profile & Auth Buttons */}
      <div className={styles['header__right']}>
        <Button
          type="button"
          variant="ghost"
          className={styles['header__menu-toggle']}
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="primary-navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </Button>

        <div className={styles['header__auth']}>
          {loading ? (
            <div className={styles['auth-links']}>
              <span className={styles['loading-text']}>Loading...</span>
              {assistantButton}
            </div>
          ) : isAuthenticated && user ? (
            <div className={styles['user-section']}>
              {assistantButton}
              <Link to="/me" className={styles['user-profile']}>
                <Image
                  src={`${IMAGE_URL}/users/${user.photo}?t=${user.updatedAt}`}
                  alt={user.name}
                  className={styles['user-avatar']}
                />
                <span className={styles['user-name']}>{user.name.split(' ')[0]}</span>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className={styles['logout-btn']}
              >
                {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
              </Button>
            </div>
          ) : (
            <div className={styles['auth-links']}>
              {assistantButton}
              <Link to="/login" className={`${styles['nav__link']} ${styles['nav__link--login']}`}>
                Log in
              </Link>
              <Link
                to="/signup"
                className={`${styles['nav__link']} ${styles['nav__link--signup']}`}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <EternalAIAssistant
          open={assistantOpen}
          onClose={closeAssistant}
          userRole={isAuthenticated ? user?.role : null}
          memoryKey={isAuthenticated ? user?.id || user?._id : 'public'}
        />
      </Suspense>
    </header>
  );
}
