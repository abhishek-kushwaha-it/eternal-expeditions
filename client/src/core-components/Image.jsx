import { forwardRef } from 'react';
import './Image.css';

const Image = forwardRef(
  (
    {
      src,
      alt = 'Image',
      variant = 'default',
      size = 'md',
      loading = 'lazy',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClass = 'img';
    const variantClass = variant !== 'default' ? `img--${variant}` : '';
    const sizeClass = `img--${size}`;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={loading}
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`.trim()}
        {...props}
      />
    );
  }
);

Image.displayName = 'Image';

export default Image;
