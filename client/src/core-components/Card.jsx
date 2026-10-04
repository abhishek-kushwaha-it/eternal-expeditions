import { forwardRef } from 'react';
import styles from './Card.module.css';

const Card = forwardRef(({ children, className = '', header, footer, ...props }, ref) => {
  return (
    <div ref={ref} className={`${styles.card} ${className}`.trim()} data-card {...props}>
      {header && (
        <div className={styles['card__header']} data-card-part="header">
          {header}
        </div>
      )}
      <div className={styles['card__content']}>{children}</div>
      {footer && (
        <div className={styles['card__footer']} data-card-part="footer">
          {footer}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
