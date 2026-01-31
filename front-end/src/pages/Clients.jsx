import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useConfirmation } from '../context/ConfirmationProvider';
import InvoiceTemplate from '../components/InvoiceTemplate';
import { useToast } from '../context/ToastProvider';
import { Search, Plus, Phone, Mail, MapPin, Edit, FileText, Briefcase, Star, CheckSquare, User, Trash2, X, Printer } from 'lucide-react';
import { API_URL } from '../config';

const Container = styled.div`
  display: flex;
  gap: 25px;
  height: 100%;
  color: var(--text);
  font-family: 'Inter', sans-serif;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

// --- Left Sidebar (List & Filters) ---
const Sidebar = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 0;

  @media (max-width: 900px) {
    width: 100%;
    height: 350px; /* Limit height on mobile so it doesn't take up whole screen */
    border-bottom: 1px solid var(--border);
    padding-bottom: 20px;
  }
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--input-bg);
  border-radius: 8px;
  padding: 0 12px;
  border: 1px solid var(--border);

  input {
    background: transparent;
    border: none;
    color: var(--text);
    padding: 12px;
    width: 100%;
    outline: none;
    &::placeholder { color: var(--text-secondary); }
  }
`;

const NewClientBtn = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;

  &:hover { filter: brightness(1.1); }
`;

const ClientList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 5px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 3px; }
`;

const ClientItem = styled.div`
  background-color: ${props => props.$active ? 'var(--input-bg)' : 'var(--card-bg)'};
  border: 1px solid ${props => props.$active ? 'var(--primary)' : 'var(--border)'};
  padding: 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background-color: var(--bg-secondary);
    border-color: var(--border);
  }

  .name { color: var(--text); font-weight: 600; margin-bottom: 4px; }
  .sub { color: var(--text-secondary); font-size: 0.85rem; }
`;

// --- Right Main Content (Details) ---
const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const Header = styled.div`
  background-color: var(--card-bg);
  padding: 20px 30px;
  border-radius: 16px;
  border: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    .actions {
      width: 100%;
      justify-content: flex-start;
    }
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 15px;
    
    .avatar {
      width: 48px; height: 48px;
      background-color: var(--input-bg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3498db;
    }

    h2 { margin: 0; font-size: 1.4rem; color: var(--text); }
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  button {
    background: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 8px 16px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    &:hover { background: var(--bg-secondary); color: var(--text); }
    
    &.delete {
      color: #e74c3c;
      border-color: #e74c3c;
      &:hover { background: #e74c3c; color: white; }
    }
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const InfoCard = styled.div`
  background-color: var(--card-bg);
  padding: 25px;
  border-radius: 16px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 15px;

  h3 { font-size: 1rem; color: var(--text); margin: 0 0 5px 0; }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);
    font-size: 0.9rem;
    
    svg { color: var(--text-secondary); }
  }

  .note-text {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.5;
    font-style: italic;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: 0.2s;
  
  &.primary {
    background-color: #27AE60;
    color: white;
    &:hover { background-color: #219150; }
  }
  
  &.secondary {
    background-color: var(--input-bg);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    &:hover { background-color: var(--bg-secondary); color: var(--text); }
  }
`;

const HistorySection = styled.div`
  background-color: var(--card-bg);
  padding: 25px;
  border-radius: 16px;
  border: 1px solid var(--border);
  flex: 1;

  h3 { color: var(--text); margin-bottom: 20px; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  th { text-align: left; color: var(--text-secondary); padding: 10px; border-bottom: 1px solid var(--border); }
  td { padding: 15px 10px; border-bottom: 1px solid var(--border); color: var(--text); }
  
  .status {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
    
    &.paid { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
    &.open { background: rgba(230, 126, 34, 0.2); color: #E67E22; }
  }

  .btn-sm {
    padding: 4px 10px;
    background: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    &:hover { color: var(--text); border-color: var(--text-secondary); }
  }
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: var(--card-bg);
  padding: 30px;
  border-radius: 16px;
  width: 500px;
  border: 1px solid var(--border);
  position: relative;

  h2 { margin-top: 0; color: var(--text); }
  
  .close-btn {
    position: absolute;
    top: 20px; right: 20px;
    background: none; border: none;
    color: var(--text-secondary); cursor: pointer;
    &:hover { color: var(--text); }
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  
  label { display: block; color: var(--text-secondary); margin-bottom: 5px; font-size: 0.9rem; }
  input, textarea {
    width: 100%;
    background: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 10px;
    border-radius: 6px;
    outline: none;
    &:focus { border-color: var(--primary); }
  }
  textarea { resize: vertical; min-height: 80px; }
`;

const SubmitBtn = styled.button`
  width: 100%;
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  &:hover { filter: brightness(1.1); }
`;

// --- Invoice Modal Styles ---
const InvoiceModalContent = styled.div`
  background: var(--card-bg);
  color: var(--text);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
  position: relative;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: var(--input-bg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;

  h3 { margin: 0; font-size: 1.1rem; color: var(--text); }
  
  .actions {
    display: flex;
    gap: 10px;
  }

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    &:hover { color: var(--text); }
  }
`;


/**
 * Clients Management Page
 * Allows viewing, searching, adding, editing, and deleting clients.
 * Shows client details including transaction history.
 */
const Clients = () => {
  const navigate = useNavigate();
  const { requestConfirmation } = useConfirmation();
  const { addToast } = useToast();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    if (selectedClient) {
      fetch(`${API_URL}/api/clients/${selectedClient.id}/history`)
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error('Error fetching history:', err));
    } else {
      setHistory([]);
    }
  }, [selectedClient]);

  const handleViewInvoice = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${id}`);
      const data = await response.json();
      setSelectedInvoice(data);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  /**
   * Load Clients
   * Fetches the complete list of clients from the backend.
   * Sets the first client as selected if available.
   */
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${API_URL}/api/clients`);
        const data = await response.json();
        setClients(data);
        if (data.length > 0) {
          setSelectedClient(data[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditClick = () => {
    if (!selectedClient) return;
    setFormData({
      name: selectedClient.name || '',
      phone: selectedClient.phone || '',
      email: selectedClient.email || '',
      address: selectedClient.address || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleNewClientClick = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  /**
   * Handle Form Submission
   * Creates a new client or Updates an existing one based on `isEditing` flag.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isEditing && selectedClient) {
      // Update existing client
      try {
        const response = await fetch(`${API_URL}/api/clients/${selectedClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const updatedClient = await response.json();
          setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
          setSelectedClient(updatedClient);
          setShowModal(false);
          setFormData({ name: '', phone: '', email: '', address: '' });
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error updating client:', error);
      }
    } else {
      // Create new client
      try {
        const response = await fetch(`${API_URL}/api/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          const newClient = await response.json();
          setClients([newClient, ...clients]);
          setSelectedClient(newClient);
          setShowModal(false);
          setFormData({ name: '', phone: '', email: '', address: '' });
        }
      } catch (error) {
        console.error('Error creating client:', error);
      }
    }
  };

  /**
   * Delete Client
   * Prompts for confirmation before deleting a client.
   * Removes client from state on success.
   */
  const handleDelete = (id) => {
    requestConfirmation({
      title: 'Delete Client',
      message: 'Are you sure you want to delete this client?',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/api/clients/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            const updatedClients = clients.filter(c => c.id !== id);
            setClients(updatedClients);
            addToast('Client deleted successfully', 'success');
            if (selectedClient && selectedClient.id === id) {
              setSelectedClient(updatedClients[0] || null);
            }
          } else {
            addToast('Failed to delete client', 'error');
          }
        } catch (error) {
          console.error('Error deleting client:', error);
          addToast('Error deleting client', 'error');
        }
      }
    });
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      {/* Left Sidebar */}
      <Sidebar>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '10px' }}>
            <NewClientBtn onClick={handleNewClientClick}>
                <Plus size={18} /> New Client
            </NewClientBtn>
            <SearchInput>
                <Search size={18} color="#666" />
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </SearchInput>
        </div>

        <ClientList>
          {clients.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.phone && c.phone.includes(searchQuery))
          ).map(client => (
            <ClientItem 
              key={client.id} 
              $active={selectedClient && client.id === selectedClient.id}
              onClick={() => setSelectedClient(client)}
            >
              <div className="name">{client.name}</div>
              <div className="sub">{client.phone || 'No phone'}</div>
            </ClientItem>
          ))}
        </ClientList>
      </Sidebar>

      {/* Right Main Content */}
      <MainContent>
        {selectedClient ? (
          <>
            <Header>
              <div className="profile">
                <div className="avatar"><User size={24} /></div>
                <h2>{selectedClient.name}</h2>
              </div>
              <div className="actions">
                <button onClick={handleEditClick}><Edit size={16} /> Edit Info</button>
                <button className="delete" onClick={() => handleDelete(selectedClient.id)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </Header>

            <InfoGrid>
              <InfoCard>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3>Contact Info</h3>
                  <Star size={16} color="#E67E22" fill="#E67E22" />
                </div>
                <div className="row"><Phone size={16} /> {selectedClient.phone || 'N/A'}</div>
                <div className="row"><Mail size={16} /> {selectedClient.email || 'N/A'}</div>
                <div className="row"><MapPin size={16} /> {selectedClient.address || 'N/A'}</div>
              </InfoCard>

              <InfoCard>
                <h3>Notes</h3>
                <p className="note-text">
                  No notes available for this client.
                </p>
              </InfoCard>

              <InfoCard>
                <h3>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ActionButton 
                    className="primary"
                    onClick={() => navigate('/invoices/new', { state: { clientName: selectedClient?.name } })}
                  >
                    <FileText size={16} /> Create New Invoice
                  </ActionButton>
                  <ActionButton className="secondary">
                    <Briefcase size={16} /> Start New Project
                  </ActionButton>
                </div>
              </InfoCard>
            </InfoGrid>

            <HistorySection>
              <h3>History of Projects & Invoices</h3>
              <div className="table-responsive">
              <Table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Project / Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length > 0 ? history.map((item, i) => (
                    <tr key={i}>
                      <td>#{item.invoice_number || item.id}</td>
                      <td>Invoice</td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>${parseFloat(item.total_amount).toLocaleString()}</td>
                      <td><span className={`status ${item.status ? item.status.toLowerCase() : 'pending'}`}>{item.status || 'Pending'}</span></td>
                      <td>
                        <button className="btn-sm" onClick={() => handleViewInvoice(item.id)}>View</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center', color: '#666'}}>No history available yet</td>
                    </tr>
                  )}
                </tbody>
              </Table>
              </div>
            </HistorySection>
          </>
        ) : (
          <div style={{ padding: '20px', color: '#666' }}>Select a client to view details</div>
        )}
      </MainContent>

      {/* Add Client Modal */}
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
            <h2>{isEditing ? 'Edit Client Info' : 'Add New Client'}</h2>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                />
              </FormGroup>
              <FormGroup>
                <label>Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                />
              </FormGroup>
              <FormGroup>
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                />
              </FormGroup>
              <FormGroup>
                <label>Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                />
              </FormGroup>
              <SubmitBtn type="submit">{isEditing ? 'Save Changes' : 'Create Client'}</SubmitBtn>
            </form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Invoice View Modal */}
      {showInvoiceModal && selectedInvoice && (
        <ModalOverlay onClick={() => setShowInvoiceModal(false)}>
          <InvoiceModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h3>Invoice Details</h3>
              <div className="actions">
                <button title="Print" onClick={() => window.print()}><Printer size={20} /></button>
                <button title="Close" onClick={() => setShowInvoiceModal(false)}><X size={24} /></button>
              </div>
            </ModalHeader>
            
            <InvoiceTemplate invoice={selectedInvoice} />
          </InvoiceModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default Clients;
