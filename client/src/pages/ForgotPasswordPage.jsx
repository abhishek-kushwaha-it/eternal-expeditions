import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, FormGroup, LoadingState } from '../core-components';
import { useForgotPasswordMutation } from '../hooks/useQueries';
import { useAuth } from '../hooks/useAuth';
import styles from './AuthPages.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const forgotPasswordMutation = useForgotPasswordMutation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const validateEmail = (email) => {
    return email.includes('@') && email.includes('.');
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError('Valid email is required');
      return;
    }
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      setIsSubmitted(true);
    } catch (error) {
      setEmailError(
        error.response?.data?.message || 'Unable to send the reset link. Please try again.'
      );
    }
  };

  // Loading state while sending reset link
  if (forgotPasswordMutation.isPending && !isSubmitted) {
    return <LoadingState message="Sending reset link..." minHeight="60vh" />;
  }

  if (isSubmitted) {
    return (
      <main className="main">
        <div className={styles['auth-container']}>
          <div className={styles['auth-card']}>
            <div>✓</div>
            <h2>Check Your Email</h2>
            <p>If an account exists for that email, reset instructions will be sent.</p>
            <p>
              Click the link in your email to reset your password. Check your spam folder if you
              don't see it.
            </p>
            <p>⏱️ Link expires in 10 minutes.</p>
            <Button variant="primary" size="md" fullWidth onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className={styles['auth-container']}>
        <div className={styles['auth-card']}>
          <div className={styles['auth-header']}>
            <h1 className="heading-primary">Reset Password</h1>
            <p className={styles['auth-subtitle']}>We'll send you a reset link</p>
          </div>

          <form className={styles['auth-form']} onSubmit={handleSubmit}>
            <FormGroup
              type="email"
              name="email"
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={handleChange}
              error={emailError}
              disabled={forgotPasswordMutation.isPending}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={forgotPasswordMutation.isPending}
            >
              Send Reset Link
            </Button>
          </form>

          <div className={styles['auth-footer']}>
            Remember your password?{' '}
            <Link to="/login" className={styles['auth-footer-link']}>
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
