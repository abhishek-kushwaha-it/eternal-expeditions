import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, FormGroup } from '../core-components';
import { useLoginMutation } from '../hooks/useQueries';
import { useAuth } from '../hooks/useAuth';
import { useToasts } from '../store/hooks';
import styles from './AuthPages.module.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const { login, isAuthenticated, loading } = useAuth();
  const { addToast } = useToasts();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please fix the errors', 'error');
      return;
    }

    try {
      const response = await loginMutation.mutateAsync(formData);
      login(response.data.data.user);
      addToast('Logged in successfully!', 'success');
      setTimeout(() => navigate('/'), 500);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      addToast(message, 'error');
    }
  };

  return (
    <main className={`main ${styles['login-page-root']}`}>
      <div className={styles['auth-container']}>
        <div className={styles['auth-card']}>
          <div className={styles['auth-header']}>
            <h1 className="heading-primary">Log In</h1>
            <p className={styles['auth-subtitle']}>Welcome back!</p>
          </div>

          <form className={styles['auth-form']} onSubmit={handleSubmit}>
            <FormGroup
              type="email"
              name="email"
              label="Email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={loginMutation.isPending}
              required
            />

            <FormGroup
              type="password"
              name="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={loginMutation.isPending}
              required
            />

            <div className={styles['auth-form-footer']}>
              <Link to="/forgot-password" className={styles['auth-form-footer']}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={loginMutation.isPending}
            >
              Log In
            </Button>
          </form>

          <div className={styles['auth-footer']}>
            Don't have an account?{' '}
            <Link to="/signup" className={styles['auth-footer-link']}>
              Sign up here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
