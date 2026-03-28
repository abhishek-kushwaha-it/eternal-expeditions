import { forwardRef } from 'react';
import './Card.css';

const Card = forwardRef(({ children, className = '', header, footer, ...props }, ref) => {
  return (
    <div ref={ref} className={`card ${className}`.trim()} {...props}>
      {header && <div className="card__header">{header}</div>}
      <div className="card__content">{children}</div>
      {footer && <div className="card__footer">{footer}</div>}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
