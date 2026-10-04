import { memo } from 'react';
import Button from './Button';
import styles from './ErrorState.module.css';

/**
 * ErrorState Component
 * Unified error display across pages
 * Replaces inconsistent error markup patterns (error__*, error-state__*, etc.)
 */
const ErrorState = memo(
  ({
    title = 'Something went wrong',
    message = 'Unable to load the requested data',
    emoji = '⚠️',
    actionLabel = 'Try Again',
    onAction,
    actionLink,
    showAction = true,
    animated = false,
  }) => {
    return (
      <div
        className={`${styles['error-state']} ${animated ? styles['error-state--animated'] : ''}`.trim()}
      >
        <div>
          {emoji && <span className={styles['error-state__emoji']}>{emoji}</span>}
          <h2 className={styles['error-state__title']}>{title}</h2>
          <p className={styles['error-state__message']}>{message}</p>
        </div>

        {showAction && (
          <div className={styles['error-state__action']}>
            {onAction ? (
              <Button variant="primary" size="md" onClick={onAction}>
                {actionLabel}
              </Button>
            ) : actionLink ? (
              <Button as="a" href={actionLink} variant="primary" size="md">
                {actionLabel}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

ErrorState.displayName = 'ErrorState';

export default ErrorState;
