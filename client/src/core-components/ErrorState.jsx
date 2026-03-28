import { memo } from 'react';
import Button from './Button';
import './ErrorState.css';

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
  }) => {
    return (
      <div className="error-state">
        <div className="error-state__content">
          {emoji && <span className="error-state__emoji">{emoji}</span>}
          <h2 className="error-state__title">{title}</h2>
          <p className="error-state__message">{message}</p>
        </div>

        {showAction && (
          <div className="error-state__action">
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
