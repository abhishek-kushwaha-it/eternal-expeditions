import { createSlice } from '@reduxjs/toolkit';

const toastSlice = createSlice({
  name: 'toasts',
  initialState: {
    items: [],
  },
  reducers: {
    addToast: {
      reducer: (state, action) => {
        state.items.push(action.payload);
      },
      prepare: (message, type = 'success', duration = 3000) => {
        const id = Date.now() + Math.random();

        return {
          payload: {
            id,
            message,
            type,
            duration,
            createdAt: Date.now(),
          },
        };
      },
    },
    removeToast: (state, action) => {
      state.items = state.items.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.items = [];
    },
  },
});

export const { addToast, removeToast, clearToasts } = toastSlice.actions;
export default toastSlice.reducer;
