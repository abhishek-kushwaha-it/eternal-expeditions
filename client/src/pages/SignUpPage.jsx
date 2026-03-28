import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, FormGroup } from '../core-components';
import { useSignupMutation } from '../hooks/useQueries';
import { useAuth } from '../hooks/useAuth';
import { useToasts } from '../store/hooks';
import './SignUpPage.css';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const signupMutation = useSignupMutation();
  const { isAuthenticated, loading } = useAuth();
  const { addToast } = useToasts();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be 8+ characters';
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }
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

    // Prevent multiple simultaneous submissions
    if (signupMutation.isPending) {
      // console.warn('Signup already in progress, ignoring duplicate submit'); // Helpful for development
      return;
    }

    if (!validateForm()) {
      addToast('Please fix the errors', 'error');
      return;
    }

    try {
      // console.log('Starting signup for email:', formData.email); // Helpful for development
      await signupMutation.mutateAsync(formData);
      addToast('Account created! Welcome!', 'success');
      // Clear form after success
      setFormData({
        name: '',
        email: '',
        password: '',
        passwordConfirm: '',
      });
      setErrors({});
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      // console.error('Signup error:', err.response?.data?.message || err.message); // Helpful for development
      const message = err.response?.data?.message || 'Signup failed';
      addToast(message, 'error');

      // If duplicate email error, suggest login
      if (message.includes('email') && message.includes('already')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    }
  };

  return (
    <main className="main">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="heading-primary">Create Account</h1>
            <p className="auth-subtitle">Join thousands of adventurers</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <FormGroup
              type="text"
              name="name"
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              disabled={signupMutation.isPending}
              required
            />

            <FormGroup
              type="email"
              name="email"
              label="Email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={signupMutation.isPending}
              required
            />

            <div className="auth-form-row">
              <FormGroup
                type="password"
                name="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                disabled={signupMutation.isPending}
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
                disabled={signupMutation.isPending}
                required
              />
            </div>

            <div className="auth-checkbox">
              <input type="checkbox" id="terms" required disabled={signupMutation.isPending} />
              <label htmlFor="terms" className="auth-checkbox-label">
                I agree to the{' '}
                <Link to="#" className="auth-checkbox-link">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link to="#" className="auth-checkbox-link">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={signupMutation.isPending}
              disabled={signupMutation.isPending}
            >
              Create Account
            </Button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" className="auth-footer-link">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
