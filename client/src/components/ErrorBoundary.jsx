import { Component } from 'react';
import { Button } from '../core-components';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // Silent error catching - could integrate with error tracking service
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="main error-boundary">
          <div className="error-boundary__icon" aria-label="Error icon">
            ⚠️
          </div>
          <h1 className="error-boundary__title">Something Went Wrong</h1>
          <p className="error-boundary__message">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <Button variant="primary" onClick={this.resetError} aria-label="Try again button">
            Try Again
          </Button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
