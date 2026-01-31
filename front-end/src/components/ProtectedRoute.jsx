import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--background);
  color: var(--text);
  font-size: 1.2rem;
`;

/**
 * Protected Route Wrapper
 * Checks `AuthContext` before rendering child routes.
 * Redirects to /login if user is not authenticated.
 * Renders a Loading spinner while checking token validity.
 */
const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingContainer>Loading...</LoadingContainer>;
    }

    // If authorized, return an outlet that will render child elements
    // We also wrap it in the Layout here, so Login page DOES NOT use the Layout
    return isAuthenticated ? <Layout><Outlet /></Layout> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
