import { forwardRef } from 'react';
import styles from './FormGroup.module.css';

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
        <div className={styles['form-group']} data-form-group>
          {label && (
            <label
              htmlFor={name}
              className={styles['form-group__label']}
              data-form-group-label
            >
              {label}
              {required && (
                <span className={styles['form-group__required']} data-form-group-required>
                  *
                </span>
              )}
            </label>
          )}
          <select
            ref={ref}
            id={name}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={styles['form-group__select']}
            data-form-group-control
            {...props}
          >
            <option value="">-- Select --</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {error && (
            <span className={styles['form-group__error']} data-form-group-error>
              {error}
            </span>
          )}
          {helperText && !error && (
            <span className={styles['form-group__helper']} data-form-group-helper>
              {helperText}
            </span>
          )}
        </div>
      );
    }

    // Render textarea element if type is 'textarea'
    if (type === 'textarea') {
      return (
        <div className={styles['form-group']} data-form-group>
          {label && (
            <label
              htmlFor={name}
              className={styles['form-group__label']}
              data-form-group-label
            >
              {label}
              {required && (
                <span className={styles['form-group__required']} data-form-group-required>
                  *
                </span>
              )}
            </label>
          )}
          <textarea
            ref={ref}
            id={name}
            name={name}
            placeholder={placeholder}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={styles['form-group__textarea']}
            data-form-group-control
            {...props}
          />
          {error && (
            <span className={styles['form-group__error']} data-form-group-error>
              {error}
            </span>
          )}
          {helperText && !error && (
            <span className={styles['form-group__helper']} data-form-group-helper>
              {helperText}
            </span>
          )}
        </div>
      );
    }

    // Default: render input element
    return (
      <div className={styles['form-group']} data-form-group>
        {label && (
          <label
            htmlFor={name}
            className={styles['form-group__label']}
            data-form-group-label
          >
            {label}
            {required && (
              <span className={styles['form-group__required']} data-form-group-required>
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          pattern={pattern}
          className={styles['form-group__input']}
          data-form-group-control
          {...props}
        />
        {error && (
          <span className={styles['form-group__error']} data-form-group-error>
            {error}
          </span>
        )}
        {helperText && !error && (
          <span className={styles['form-group__helper']} data-form-group-helper>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

export default FormGroup;
