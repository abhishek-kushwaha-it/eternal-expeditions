import { useState, useCallback, useRef } from 'react';
import { Button } from '.';
import './ConfirmDialog.css';

/**
 * ConfirmDialog Component
 * Professional modal confirmation dialog
 * Replaces window.confirm() across management pages
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <div className="confirm-dialog__content">
          <h2 className="confirm-dialog__title">{title}</h2>
          <p className="confirm-dialog__message">{message}</p>
        </div>

        <div className="confirm-dialog__actions">
          <Button variant="secondary" size="md" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={isDangerous ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage ConfirmDialog state
 * Usage: const confirm = useConfirmDialog()
 * Then: confirm.open({ ... }) and await confirm.promise
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirmDialog() {
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDangerous: false,
    isLoading: false,
  });
  const resolvePromiseRef = useRef(null);

  const open = useCallback((config) => {
    setDialog((prev) => ({
      ...prev,
      isOpen: true,
      ...config,
    }));

    return new Promise((resolve) => {
      resolvePromiseRef.current = resolve;
    });
  }, []);

  const close = useCallback(() => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const confirm = useCallback(() => {
    resolvePromiseRef.current?.(true);
    close();
  }, [close]);

  const cancel = useCallback(() => {
    resolvePromiseRef.current?.(false);
    close();
  }, [close]);

  return {
    dialog,
    open,
    confirm,
    cancel,
    setLoading: (loading) => setDialog((prev) => ({ ...prev, isLoading: loading })),
  };
}
