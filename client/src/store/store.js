import { configureStore } from '@reduxjs/toolkit';
import toastReducer from './toastSlice';

export const store = configureStore({
  reducer: {
    toasts: toastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['toasts/addToast'],
        ignoredPaths: ['toasts.items'],
      },
    }),
});

export default store;
