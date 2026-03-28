import { useState, useCallback } from 'react';
import { validateForm } from '../utils';

/**
 * Custom hook for managing form state and validation
 * Usage: const { formData, errors, handleChange, handleSubmit, setFormData, resetForm } = useForm(initialData, onSubmit, schema)
 */
export const useForm = (initialData = {}, onSubmit = null, validationSchema = null) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const finalValue = type === 'checkbox' ? checked : value;

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));

      // Validate field on change if schema exists
      if (validationSchema && validationSchema[name]) {
        const fieldSchema = { [name]: validationSchema[name] };
        const fieldData = { [name]: finalValue };
        const newErrors = validateForm(fieldData, fieldSchema);

        if (Object.keys(newErrors).length === 0) {
          setErrors((prev) => {
            const updated = { ...prev };
            delete updated[name];
            return updated;
          });
        } else {
          setErrors((prev) => ({
            ...prev,
            ...newErrors,
          }));
        }
      }
    },
    [validationSchema]
  );

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      if (e?.preventDefault) {
        e.preventDefault();
      }

      // Validate all fields
      if (validationSchema) {
        const newErrors = validateForm(formData, validationSchema);
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
          return;
        }
      }

      // Call submit handler
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(formData);
        } catch (error) {
          console.error('Form submission error:', error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [formData, onSubmit, validationSchema]
  );

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialData]);

  const setFieldValue = useCallback((name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormData,
    setFieldValue,
    setFieldError,
    getFieldProps: (name) => ({
      name,
      value: formData[name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
    }),
  };
};

export default useForm;
