import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Search, Eye, FileText, Mail, Share2, Filter, X, Printer, CheckCircle, Trash2, ShoppingCart, Edit } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useToast } from '../context/ToastProvider';
import { useConfirmation } from '../context/ConfirmationProvider';
import InvoiceTemplate from '../components/InvoiceTemplate';
import PurchaseTemplate from '../components/PurchaseTemplate';
import { API_URL } from '../config';


const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: calc(100vh - 40px);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  h2 {
    color: var(--text);
    font-size: 1.5rem;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--input-bg);
  border-radius: 8px;
  overflow: hidden;
  width: 300px;
  border: 1px solid var(--border);

  @media (max-width: 768px) {
    width: 100%;
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    padding: 10px 15px;
    color: var(--text);
    outline: none;
    font-size: 0.9rem;

    &::placeholder {
      color: var(--text-secondary);
    }
  }

  button {
    background-color: var(--primary);
    border: none;
    padding: 10px 12px;
    color: var(--white);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      filter: brightness(1.1);
    }
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 10px;
  background-color: var(--card-bg);
  padding: 5px;
  border-radius: 8px;
  border: 1px solid var(--border);
  flex-wrap: wrap; /* Allow wrapping on small screens */
  
  button {
    background: none;
    border: none;
    color: var(--text-secondary);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: 0.2s;
    
    &.active {
      background-color: var(--input-bg);
      color: var(--text);
      font-weight: 600;
      border: 1px solid var(--border);
    }

    &:hover:not(.active) {
      color: var(--text);
    }
  }
`;

const InvoiceList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  overflow-y: auto;
  padding-right: 5px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 3px; }
`;

const InvoiceCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  border: 1px solid var(--border);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border-color: var(--text-secondary);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .client {
      font-weight: 600;
      color: var(--text);
      font-size: 1.1rem;
    }
    
    .date {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
  }

  .details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .amount {
      font-size: 1.2rem;
      font-weight: bold;
      color: #27ae60;
    }

    .status {
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
      
      &.paid { background-color: rgba(76, 175, 80, 0.2); color: #4CAF50; }
      &.pending { background-color: rgba(230, 126, 34, 0.2); color: #E67E22; }
      &.open { background-color: rgba(230, 126, 34, 0.2); color: #E67E22; }
    }
  }

  .actions {
    display: flex;
    gap: 10px;
    margin-top: auto;
    padding-top: 15px;
    border-top: 1px solid var(--border);

    button {
      flex: 1;
      background: var(--input-bg);
      border: none;
      color: var(--text-secondary);
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.2s;

      &:hover {
        background: var(--bg-secondary);
        color: var(--text);
      }
    }
  }
`;

// --- Modal Styles ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
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
 * Orders & Invoices History
 * Displays list of all Sales (Invoices/Quotes) and Purchase Orders.
 * Allows filtering, status updates, and converting Quotes to Invoices.
 */
const OrdersInvoices = () => {
  const { addToast } = useToast();
  const { requestConfirmation } = useConfirmation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('sales'); // 'sales' | 'purchases'
  const [activeTab, setActiveTab] = useState('All');
  const [invoices, setInvoices] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfInvoice, setPdfInvoice] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, purRes, setRes] = await Promise.all([
            fetch(`${API_URL}/api/invoices`),
            fetch(`${API_URL}/api/purchases`),
            fetch(`${API_URL}/api/settings`)
        ]);
        
        const invData = await invRes.json();
        const purData = await purRes.json();
        const setData = await setRes.json();
        
        setInvoices(invData);
        setPurchases(purData);
        setSettings(setData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewInvoice = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${id}`);
      const data = await response.json();
      
      // Ensure specific settings are fresh for the modal view
      const settingsRes = await fetch(`${API_URL}/api/settings`);
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

      setSelectedInvoice(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const handleViewPurchase = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/purchases/${id}`);
      const data = await response.json();
      setSelectedInvoice(data);
      setShowModal(true);
    } catch (error) {
        console.error('Error fetching purchase details:', error);
    }
  };


    const handleDownloadInvoice = async (id) => {
      try {
        const response = await fetch(`${API_URL}/api/invoices/${id}`);
        const data = await response.json();
        const settingsRes = await fetch(`${API_URL}/api/settings`);
        const settingsData = await settingsRes.json();
        
        // Always update settings to ensure logo/info is fresh for printing
        setSettings(settingsData);
        
        setPdfInvoice(data);
        
        // Allow time for render
        setTimeout(() => {
            const element = document.getElementById('invoice-pdf-template');
            const opt = {
              margin: 10,
              filename: `invoice-${data.invoice_number || id}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        }, 500);

      } catch (error) {
        console.error('Error fetching invoice for PDF:', error);
      }
    };


  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    try {
      const response = await fetch(`${API_URL}/api/invoices/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setInvoices(invoices.map(inv => 
          inv.id === id ? { ...inv, status: newStatus } : inv
        ));
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const handleDeleteInvoice = (id) => {
    console.log("Using ConfirmationProvider for delete invoice");
    requestConfirmation({
      title: 'Delete Invoice',
      message: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/api/invoices/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            setInvoices(invoices.filter(inv => inv.id !== id));
            addToast("Invoice deleted", "success");
          }
        } catch (error) {
          console.error('Error deleting invoice:', error);
          addToast("Error deleting invoice", "error");
        }
      }
    });
  };

  /**
   * Convert Quote to Invoice
   * Vital Action: Transforms a "Quote" (no stock impact) into an "Invoice" (stock deducted).
   * backend endpoint handles the inventory reduction.
   */
  const handleConvertClick = (id) => {
    requestConfirmation({
      title: 'Convert Quote to Invoice?',
      message: 'This action will finalize the sales document and IMMEDIATELY DEDUCT STOCK for all items. Please ensure you have sufficient inventory.',
      type: 'warning',
      onConfirm: async () => {
        try {
            const res = await fetch(`${API_URL}/api/invoices/${id}/convert`, { method: 'PUT' });
            if(res.ok) {
                addToast("Quote converted to Invoice!", "success");
                setInvoices(invoices.map(i => i.id === id ? { ...i, type: 'invoice', status: 'Pending' } : i));
            } else {
                const err = await res.json();
                if (err.errors && Array.isArray(err.errors)) {
                    err.errors.forEach(e => addToast(e, "error"));
                } else {
                    addToast("Failed: " + (err.message || "Unknown error"), "error");
                }
            }
        } catch(e) { console.error(e); addToast("Network Error", "error"); }
      }
    });
  };

  useEffect(() => {
    if (pdfInvoice) {
      const element = document.getElementById('invoice-pdf-template');
      const opt = {
        margin: 10,
        filename: `Invoice_${String(pdfInvoice.invoice_number).padStart(6, '0')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, scrollY: 0, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        setPdfInvoice(null);
      });
    }
  }, [pdfInvoice]);

    const handleDeletePurchase = (id) => {
        requestConfirmation({
            title: 'Delete Purchase Record?',
            message: 'This will REMOVE the purchase items from your stock levels. Use this if you made a mistake entry.',
            type: 'warning',
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_URL}/api/purchases/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        setPurchases(purchases.filter(p => p.id !== id));
                        addToast("Purchase deleted and Stock reversed.", "success");
                    } else {
                        addToast("Failed to delete purchase.", "error");
                    }
                } catch (e) {
                    console.error(e);
                    addToast("Network Error", "error");
                }
            }
        });
    };

    const filteredInvoices = invoices.filter(inv => {
      let matchesTab = activeTab === 'All';
      if (!matchesTab) {
        if (activeTab === 'Quote') matchesTab = inv.type === 'quote';
        else matchesTab = inv.status === activeTab;
      }
      const matchesSearch = (inv.client_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
  });

  const filteredPurchases = purchases.filter(p => 
      (p.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
          <h2>Orders & History</h2>
          <div style={{ display: 'flex', background: 'var(--card-bg)', gap: '5px' }}>
            <button 
                style={{ 
                    background: viewMode === 'sales' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'sales' ? 'var(--white)' : 'var(--text-secondary)',
                    border: viewMode === 'sales' ? 'none' : '1px solid var(--border)',
                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                }}
                onClick={() => setViewMode('sales')}
            >
                Client Sales
            </button>
            <button 
                style={{ 
                    background: viewMode === 'purchases' ? 'var(--primary)' : 'transparent',
                    color: viewMode === 'purchases' ? 'var(--white)' : 'var(--text-secondary)',
                    border: viewMode === 'purchases' ? 'none' : '1px solid var(--border)',
                    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600
                }}
                onClick={() => setViewMode('purchases')}
            >
                Supplier Purchases
            </button>
          </div>
        </div>
        <Controls>
          {viewMode === 'sales' && (
          <FilterTabs>
            {['All', 'Pending', 'Paid', 'Quote'].map(tab => (
              <button 
                key={tab} 
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </FilterTabs>
          )}
          <SearchContainer>
            <input 
                type="text" 
                placeholder={viewMode === 'sales' ? "Search clients..." : "Search suppliers..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button><Search size={16} /></button>
          </SearchContainer>
        </Controls>
      </Header>

      <InvoiceList>
        {viewMode === 'sales' ? (
            filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
            <InvoiceCard key={inv.id}>
                <div className="header">
                <span className="client">{inv.client_name || 'Unknown Client'}</span>
                <span className="date">{new Date(inv.created_at).toLocaleDateString()}</span>
                </div>
                <div className="details">
                <span className="amount">${parseFloat(inv.total_amount).toFixed(2)}</span>
                <span className={`status ${inv.status.toLowerCase()}`} style={inv.type === 'quote' ? { background: '#FFF3CD', color: '#856404', border: '1px solid #FFEeba' } : {}}>
                    {inv.type === 'quote' ? 'QUOTE' : inv.status}
                </span>
                </div>
                <div className="actions">
                <button title="View Details" onClick={() => handleViewInvoice(inv.id)}><Eye size={16} /></button>
                <button title="Download PDF" onClick={() => handleDownloadInvoice(inv.id)}><FileText size={16} /></button>
                
                {inv.type === 'quote' ? (
                   <>
                       <button 
                          title="Edit Quote" 
                          onClick={() => navigate(`/invoices/new?orderId=${inv.id}`)}
                          style={{ color: '#F39C12' }}
                       >
                         <Edit size={16} />
                       </button>
                       <button 
                          title="Convert to Invoice" 
                          onClick={() => handleConvertClick(inv.id)}
                          style={{ color: '#27AE60', background: '#E8F8F5', flex: 2, fontWeight: 'bold', fontSize: '0.8rem' }}
                       >
                         Convert to Invoice
                       </button>
                   </>
                ) : (
                    <button 
                        title={inv.status === 'Paid' ? "Mark as Pending" : "Mark as Paid"} 
                        onClick={() => handleStatusToggle(inv.id, inv.status)}
                        style={{ color: inv.status === 'Paid' ? '#4CAF50' : '#aaa' }}
                    >
                        <CheckCircle size={16} />
                    </button>
                )}

                <button title="Delete Invoice" onClick={() => handleDeleteInvoice(inv.id)} style={{ color: '#E74C3C' }}><Trash2 size={16} /></button>
                </div>
            </InvoiceCard>
            )) : (
            <div style={{color: '#666', padding: '20px'}}>No sales invoices found.</div>
            )
        ) : (
            filteredPurchases.length > 0 ? filteredPurchases.map(p => (
            <InvoiceCard key={p.id} onClick={() => handleViewPurchase(p.id)}>
                <div className="header">
                <span className="client">{p.supplier_name || 'Unknown Supplier'}</span>
                <span className="date">{new Date(p.purchase_date).toLocaleDateString()}</span>
                </div>
                <div className="details">
                <span className="amount">${parseFloat(p.total_amount).toFixed(2)}</span>
                <span className="status paid" style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db' }}>PURCHASE</span>
                </div>
                <div className="actions">
                    <button title="View Details" onClick={(e) => { e.stopPropagation(); handleViewPurchase(p.id); }}>
                        <Eye size={16} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <ShoppingCart size={16} />
                        <span>Restocked</span>
                    </div>
                    <button title="Delete Purchase" onClick={(e) => { e.stopPropagation(); handleDeletePurchase(p.id); }} style={{ color: '#E74C3C', marginLeft: '10px' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </InvoiceCard>
            )) : (
            <div style={{color: '#666', padding: '20px'}}>No purchases found.</div>
            )
        )}
      </InvoiceList>

      {showModal && selectedInvoice && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h3>{viewMode === 'sales' ? 'Invoice Details' : 'Purchase Details'}</h3>
              <div className="actions">
                <button title="Print" onClick={() => window.print()}><Printer size={20} /></button>
                <button title="Close" onClick={() => setShowModal(false)}><X size={24} /></button>
              </div>
            </ModalHeader>
            
            {viewMode === 'sales' ? (
                <InvoiceTemplate invoice={selectedInvoice} settings={settings} />
            ) : (
                <PurchaseTemplate purchase={selectedInvoice} settings={settings} />
            )}
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id="invoice-pdf-template" style={{ width: '180mm', background: 'white', color: 'black' }}>
          {pdfInvoice && <InvoiceTemplate invoice={pdfInvoice} settings={settings} />}
        </div>
      </div>
    </Container>
  );
};

export default OrdersInvoices;
