import { useState, useEffect } from 'react';
import { AuthContext } from './authContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on mount
    // Since we're using HttpOnly cookies, the frontend cannot directly read the JWT
    // Instead, we verify authentication by calling the /users/me endpoint
    // The browser automatically includes the jwt cookie in the request
    const checkAuth = async () => {
      try {
        // Use import.meta.env.VITE_API_URL which is automatically set by Vite based on .env.development or .env.production
        const apiUrl = import.meta.env.VITE_API_URL;
        // Add timeout to prevent indefinite waiting
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${apiUrl}/users/me`, {
          credentials: 'include', // Important: include cookies in the request
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setUser(data.data.data);
          setIsAuthenticated(true);
        } else {
          // User not authenticated (cookie expired or invalid)
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        // Auth check failed silently (timeout, network error, etc.)
        // This is expected behavior - user is not authenticated
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Set user after successful login
  // The token is automatically stored in an HttpOnly cookie by the backend
  // This function is called after the login API request succeeds
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Note: Token is already in HttpOnly cookie, no need to store in localStorage
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // Cookie is cleared on the server when /users/logout is called
  };

  const updateUser = (updatedData) => {
    setUser({ ...user, ...updatedData });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
