import React, { createContext, useContext, useState } from 'react';
import styled from 'styled-components';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

const ConfirmationContext = createContext();

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
`;

const Modal = styled.div`
  background: var(--card-bg);
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: center;
  animation: fadeIn 0.2s ease-out;

  @media (max-width: 500px) {
    padding: 20px;
    width: 95%;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  h3 {
    margin: 0;
    color: var(--text);
    font-size: 1.25rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.5;
    font-size: 0.95rem;
  }

  .actions {
    display: flex;
    gap: 15px;
    margin-top: 10px;

    button {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.95rem;
      transition: filter 0.2s;

      &:hover { filter: brightness(1.1); }
    }

    .cancel {
      background: var(--input-bg);
      color: var(--text-secondary);
    }
    
    .confirm {
      background: #E74C3C;
      color: white;
      &.safe { background: #27AE60; }
    }
  }
`;

/**
 * Confirmation Dialog Context
 * Provides a global modal for critical actions (Delete, Irreversible updates).
 * Usage: `const { requestConfirmation } = useConfirmation();`
 */
export const ConfirmationProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger', // 'danger' | 'safe' | 'warning'
    onConfirm: null
  });

  const requestConfirmation = ({ title, message, type = 'danger', onConfirm }) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) modalState.onConfirm();
    closeModal();
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmationContext.Provider value={{ requestConfirmation }}>
      {children}
      {modalState.isOpen && (
        <ModalOverlay onClick={closeModal}>
          <Modal onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
              {modalState.type === 'safe' ? (
                <CheckCircle size={48} color="#27AE60" />
              ) : (
                <AlertTriangle size={48} color={modalState.type === 'danger' ? '#E74C3C' : '#F39C12'} />
              )}
            </div>
            <h3>{modalState.title}</h3>
            <p>{modalState.message}</p>
            <div className="actions">
              <button className="cancel" onClick={closeModal}>Cancel</button>
              <button 
                className={`confirm ${modalState.type}`}
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </Modal>
        </ModalOverlay>
      )}
    </ConfirmationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirmation = () => useContext(ConfirmationContext);
