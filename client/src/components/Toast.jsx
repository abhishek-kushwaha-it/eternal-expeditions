import { useToasts } from '../store/hooks';
import { Button } from '../core-components';
import styles from './Toast.module.css';

export default function Toast() {
  const { toasts, removeToast } = useToasts();

  return (
    <div className={styles['toast-container']}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[`toast--${toast.type}`] ?? ''}`}
        >
          <div className={styles['toast-content']}>
            <span className={styles['toast-icon']}>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '!'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className={styles['toast-message']}>{toast.message}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={styles['toast-close']}
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
