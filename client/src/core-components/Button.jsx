import { forwardRef } from 'react';
import styles from './Button.module.css';

const Button = forwardRef(
  (
    {
      type = 'button',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled = false,
      as = 'button',
      loading = false,
      children,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const computedClassName = [
      styles.btn,
      styles[`btn--${variant}`],
      styles[`btn--${size}`],
      fullWidth && styles['btn--full'],
      loading && styles['btn--loading'],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (as === 'a') {
      return (
        <a ref={ref} className={computedClassName} data-button onClick={onClick} {...props}>
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={computedClassName}
        data-button
        disabled={disabled || loading}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
