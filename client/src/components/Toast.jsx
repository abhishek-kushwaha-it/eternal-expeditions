import { useToasts } from '../store/hooks';
import { Button } from '../core-components';
import './Toast.css';

export default function Toast() {
  const { toasts, removeToast } = useToasts();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <div className="toast-content">
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  );
}
