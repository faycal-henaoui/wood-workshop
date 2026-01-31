import React, { createContext, useContext, useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;

  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    left: 20px;
    align-items: center;
  }
`;

const ToastCard = styled.div`
  background: var(--card-bg);
  color: var(--text);
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 400px;
  border-left: 5px solid ${props => props.$color};
  animation: ${slideIn} 0.3s ease-out;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);

  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }

  &:hover {
    transform: scale(1.02);
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    strong { font-size: 0.95rem; }
    span { font-size: 0.85rem; color: var(--text-secondary); }
  }

  button {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    &:hover { color: var(--text); }
  }
`;

/**
 * Toast Notification System
 * Global context for displaying temporary success/error messages.
 * Toasts auto-dismiss after 4 seconds.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', subtitle = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, subtitle }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastIcon = (type) => {
    switch(type) {
      case 'success': return <CheckCircle size={24} color="#2ECC71" />;
      case 'error': return <XCircle size={24} color="#E74C3C" />;
      case 'warning': return <AlertTriangle size={24} color="#F1C40F" />;
      default: return <Info size={24} color="#3498DB" />;
    }
  };

  const getToastColor = (type) => {
    switch(type) {
      case 'success': return '#2ECC71';
      case 'error': return '#E74C3C';
      case 'warning': return '#F1C40F';
      default: return '#3498DB';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <ToastCard key={toast.id} $color={getToastColor(toast.type)}>
            {getToastIcon(toast.type)}
            <div className="content">
              <strong>{toast.message}</strong>
              {toast.subtitle && <span>{toast.subtitle}</span>}
            </div>
            <button onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </ToastCard>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);
