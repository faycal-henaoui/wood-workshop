import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import { ToastProvider } from './context/ToastProvider';
import { ConfirmationProvider } from './context/ConfirmationProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { API_URL } from './config';

// Lazy Load Pages for Performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const InvoiceMaker = React.lazy(() => import('./pages/InvoiceMaker'));
const OrdersInvoices = React.lazy(() => import('./pages/OrdersInvoices'));
const Products = React.lazy(() => import('./pages/Products'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Stock = React.lazy(() => import('./pages/Stock'));
const Purchases = React.lazy(() => import('./pages/Purchases'));
const Clients = React.lazy(() => import('./pages/Clients'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));

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
          
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text)' }}>Loading...</div>}>
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
          </Suspense>

          </ConfirmationProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
