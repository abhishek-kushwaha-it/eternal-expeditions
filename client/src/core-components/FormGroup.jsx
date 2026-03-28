import { forwardRef } from 'react';
import './FormGroup.css';

/**
 * FormGroup Component
 * Wraps native input/select element with consistent label, error, and helper text
 * Reduces boilerplate in form pages
 */
const FormGroup = forwardRef(
  (
    {
      name,
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      onBlur,
      error,
      helperText,
      options,
      required = false,
      disabled = false,
      pattern,
      ...props
    },
    ref
  ) => {
    // Render select element if type is 'select'
    if (type === 'select') {
      return (
        <div className="form-group">
          {label && (
            <label htmlFor={name} className="form-group__label">
              {label}
              {required && <span className="form-group__required">*</span>}
            </label>
          )}
          <select
            ref={ref}
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className="form-group__select"
            {...props}
          >
            <option value="">-- Select --</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && <span className="form-group__error">{error}</span>}
          {helperText && !error && <span className="form-group__helper">{helperText}</span>}
        </div>
      );
    }

    // Render textarea element if type is 'textarea'
    if (type === 'textarea') {
      return (
        <div className="form-group">
          {label && (
            <label htmlFor={name} className="form-group__label">
              {label}
              {required && <span className="form-group__required">*</span>}
            </label>
          )}
          <textarea
            ref={ref}
            id={name}
            name={name}
            placeholder={placeholder}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className="form-group__textarea"
            {...props}
          />
          {error && <span className="form-group__error">{error}</span>}
          {helperText && !error && <span className="form-group__helper">{helperText}</span>}
        </div>
      );
    }

    // Default: render input element
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={name} className="form-group__label">
            {label}
            {required && <span className="form-group__required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          pattern={pattern}
          className="form-group__input"
          {...props}
        />
        {error && <span className="form-group__error">{error}</span>}
        {helperText && !error && <span className="form-group__helper">{helperText}</span>}
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

export default FormGroup;
