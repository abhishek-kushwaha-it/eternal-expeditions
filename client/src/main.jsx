import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { AuthProvider } from './context/AuthContext';
import store from './store/store';
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes default (can be overridden per query)
      gcTime: 1000 * 60 * 30, // 30 minutes before garbage collection
      retry: 1,
      refetchOnWindowFocus: false, // Disabled - rely on staleTime instead
      refetchOnReconnect: 'stale', // Only refetch stale queries when reconnecting
    },
    mutations: {
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
