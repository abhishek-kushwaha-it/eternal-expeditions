import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button, FormGroup, LoadingState } from '../core-components';
import { useVerifyResetToken, useResetPasswordMutation } from '../hooks/useQueries';
import { useToasts } from '../store/hooks';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState({});
  const [isSuccessful, setIsSuccessful] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToasts();

  // Verify the reset token on component mount
  const {
    data: verifyData,
    isLoading: isVerifying,
    error: verifyError,
  } = useVerifyResetToken(token);
  const resetPasswordMutation = useResetPasswordMutation();

  // Check if token is valid
  const tokenValid = verifyData?.data?.data?.tokenValid ?? false;
  const hasError = verifyError !== null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addToast('Please fix the errors below', 'error');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      });

      addToast('Password reset successfully!', 'success');
      setIsSuccessful(true);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password';
      addToast(message, 'error');
    }
  };

  // Loading State - Verifying token
  if (isVerifying) {
    return <LoadingState message="Verifying reset link..." minHeight="60vh" />;
  }

  // Error State - Invalid or expired token
  if (hasError || !tokenValid) {
    return (
      <main className="main">
        <div className="auth-container">
          <div className="auth-card error-card">
            <div className="error-icon">✗</div>
            <h2 className="error-title">Invalid Reset Link</h2>
            <p className="error-message-content">
              {verifyError?.response?.data?.message ||
                'The password reset link is invalid or has expired. Please request a new one.'}
            </p>
            <div className="error-actions">
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => navigate('/forgot-password')}
              >
                Request New Reset Link
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => navigate('/login')}
                style={{ marginTop: '1rem' }}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Success State - Show after successful password reset
  if (isSuccessful) {
    return (
      <main className="main">
        <div className="auth-container">
          <div className="auth-card success-card">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Password Reset Successfully!</h2>
            <p className="success-message">
              Your password has been updated. You can now log in with your new password.
            </p>
            <div className="success-actions">
              <Button variant="primary" size="md" fullWidth onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Form State - Reset password form
  return (
    <main className="main">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-header-title">Create New Password</h1>
            <p className="auth-subtitle">Enter a strong password to secure your account</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <FormGroup
              type="password"
              name="password"
              label="New Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              helperText="At least 8 characters"
              disabled={resetPasswordMutation.isPending}
              required
            />

            <FormGroup
              type="password"
              name="passwordConfirm"
              label="Confirm Password"
              placeholder="••••••••"
              value={formData.passwordConfirm}
              onChange={handleChange}
              error={errors.passwordConfirm}
              disabled={resetPasswordMutation.isPending}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="auth-footer">
            Changed your mind?{' '}
            <Link to="/login" className="auth-footer-link">
              Go back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
