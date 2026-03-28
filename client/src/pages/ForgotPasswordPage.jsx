import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, FormGroup, LoadingState } from '../core-components';
import { useForgotPasswordMutation } from '../hooks/useQueries';
import { useAuth } from '../hooks/useAuth';
import './ForgotPasswordPage.css';

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
    await forgotPasswordMutation.mutateAsync({ email });
    setIsSubmitted(true);
  };

  // Loading state while sending reset link
  if (forgotPasswordMutation.isPending && !isSubmitted) {
    return <LoadingState message="Sending reset link..." minHeight="60vh" />;
  }

  if (isSubmitted) {
    return (
      <main className="main">
        <div className="auth-container">
          <div className="auth-card success-card">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Check Your Email</h2>
            <p className="success-message">
              Reset link sent to <strong>{email}</strong>
            </p>
            <p className="success-instructions">
              Click the link in your email to reset your password. Check your spam folder if you
              don't see it.
            </p>
            <p className="success-note">⏱️ Link expires in 10 minutes.</p>
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
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="heading-primary">Reset Password</h1>
            <p className="auth-subtitle">We'll send you a reset link</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
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

          <div className="auth-footer">
            Remember your password?{' '}
            <Link to="/login" className="auth-footer-link">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
