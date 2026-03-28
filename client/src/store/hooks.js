import { useDispatch, useSelector } from 'react-redux';
import { addToast, removeToast, clearToasts } from './toastSlice';

// Toast hooks
export const useToasts = () => {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.toasts.items);

  return {
    toasts,
    addToast: (message, type = 'success', duration = 3000) => {
      const toastId = dispatch(addToast(message, type, duration));

      // Auto-remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          dispatch(removeToast(toastId.payload.id));
        }, duration);
      }

      return toastId.payload.id;
    },
    removeToast: (id) => dispatch(removeToast(id)),
    clearToasts: () => dispatch(clearToasts()),
  };
};
