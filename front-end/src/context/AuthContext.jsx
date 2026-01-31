import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_URL } from '../config';

// Create the Context object
const AuthContext = createContext();

// Custom hook to access AuthContext easily
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider
 * Wraps the application to provide authentication state (isAuthenticated, loading)
 * and methods (login, logout) to all components.
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Verify token validity with backend
        const res = await fetch(`${API_URL}/auth/is-verify`, {
          method: "GET",
          headers: { token: token }
        });

        const parseRes = await res.json();

        if (parseRes === true) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error(err.message);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login Function
   * Saves token to LocalStorage and updates state.
   */
  const login = (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
