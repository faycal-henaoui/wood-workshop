import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import { ToastProvider } from './context/ToastProvider';
import { ConfirmationProvider } from './context/ConfirmationProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import InvoiceMaker from './pages/InvoiceMaker';
import OrdersInvoices from './pages/OrdersInvoices';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Stock from './pages/Stock';
import Purchases from './pages/Purchases';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { API_URL } from './config';

// Helper to redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; 
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

/**
 * Main Application Component
 * Sets up:
 * - Routing (React-Router)
 * - Global Providers (Auth, Toast, Confirmation)
 * - Theme management (Dark/Light mode fetching)
 * - Protected vs Public Routes handling
 */
function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        if (data.theme) setTheme(data.theme);
      })
      .catch(err => console.error('Error fetching theme:', err));
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ConfirmationProvider>
          <GlobalStyles theme={theme} />
          
          <Routes>
            {/* Public Route (Login) */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* Protected Routes (Wrapped in Layout internally via ProtectedRoute) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<OrdersInvoices />} />
              <Route path="/invoices/new" element={<InvoiceMaker />} />
              <Route path="/products" element={<Products />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/settings" element={<Settings onThemeChange={handleThemeChange} />} />
            </Route>
            
             {/* Catch all redirect */}
             <Route path="*" element={<Navigate to="/" replace /> } />
          </Routes>

          </ConfirmationProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
