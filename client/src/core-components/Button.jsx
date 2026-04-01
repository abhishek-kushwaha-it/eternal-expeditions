import { forwardRef } from 'react';
import './Button.css';

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
    const baseClass = 'btn';
    const variantClass = `btn--${variant}`;
    const sizeClass = `btn--${size}`;
    const fullWidthClass = fullWidth ? 'btn--full' : '';
    const computedClassName =
      `${baseClass} ${variantClass} ${sizeClass} ${fullWidthClass} ${className}`.trim();

    if (as === 'a') {
      return (
        <a ref={ref} className={computedClassName} onClick={onClick} {...props}>
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={computedClassName}
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
