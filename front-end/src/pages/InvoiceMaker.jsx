import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Plus, Trash2, CheckCircle, Save, X, ArrowRight, Calendar, User, Layers, Search, Box } from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { API_URL } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 30px;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  width: 100%;
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: 15px;
    gap: 15px;
  }
`;

const TopSection = styled.div`
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 30px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  border: 1px solid var(--border);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }
`;

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  label {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-wrapper {
    position: relative;
    
    svg {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
    }

    input {
      background-color: var(--input-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 14px 14px 14px 45px;
      border-radius: 8px;
      width: 100%;
      outline: none;
      font-size: 1rem;
      transition: border-color 0.2s;

      &:focus {
        border-color: var(--primary);
      }
      
      &::placeholder {
        color: var(--text-secondary);
      }
    }
  }
`;

const ItemsSection = styled.div`
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  border: 1px solid var(--border);
  min-height: 400px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border);

  h3 {
    color: var(--text);
    font-size: 1.2rem;
    margin: 0;
  }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    /* Target the button container div */
    & > div {
      width: 100%;
      flex-direction: column;
    }

    /* Make buttons full width */
    button {
      width: 100%;
      justify-content: center;
    }
  }
`;

const AddProductBtn = styled.button`
  background-color: var(--primary);
  color: var(--white);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { filter: brightness(1.1); }
`;

const Table = styled.div`
  width: 100%;
  margin-bottom: 30px;
  overflow-x: auto; /* Enable scroll if items are too wide */
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 0.5fr;
  min-width: 600px; /* Force min-width so table doesn't squish */
  padding: 0 15px 15px 15px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr 0.5fr;
  min-width: 600px; /* Force min-width so table doesn't squish */
  background-color: var(--bg-secondary);
  color: var(--text);
  padding: 15px;
  border-radius: 8px;
  align-items: center;
  margin-bottom: 12px;
  border: 1px solid var(--border);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--text-secondary);
  }

  select, input {
    background: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 10px;
    border-radius: 6px;
    width: 95%;
    font-size: 0.95rem;
    
    &:focus {
      border-color: var(--primary);
      outline: none;
    }
  }

  .scrap-info {
    font-size: 0.75rem;
    color: #4CAF50;
    margin-top: 6px;
    font-weight: 500;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px;
  color: var(--text-secondary);
  border: 2px dashed var(--border);
  border-radius: 12px;
  margin-bottom: 20px;
  
  p { margin-top: 10px; font-size: 0.9rem; }
`;

const Footer = styled.div`
  margin-top: auto;
  display: flex;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column-reverse; /* Stack summary on top of buttons */
    align-items: stretch;
    gap: 20px;
  }
`;

const LeftActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  @media (max-width: 768px) {
    flex-direction: column;
    
    .create-btn, .cancel-btn {
      width: 100%;
      justify-content: center;
      margin-left: 0;
    }
  }

  .create-btn {
    background-color: #27AE60;
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
    transition: transform 0.1s;

    &:hover { background-color: #219150; transform: translateY(-1px); }
    &:active { transform: translateY(0); }
    &:disabled { opacity: 0.7; cursor: not-allowed; }
  }

  .cancel-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: 1px solid var(--border);
    padding: 12px 20px;
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.9rem;
    margin-left: 10px;
    transition: all 0.2s;
    
    &:hover { 
      border-color: #E74C3C; 
      color: #E74C3C; 
      background: rgba(231, 76, 60, 0.1);
    }
  }
`;

const Summary = styled.div`
  text-align: right;
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  min-width: 300px;
  
  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    color: var(--text-secondary);
    font-size: 0.95rem;
    
    &.total {
      color: var(--text);
      font-size: 1.5rem;
      font-weight: 700;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid var(--border);
      margin-bottom: 0;
      align-items: center;
    }
  }
`;

const CatalogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const CatalogModal = styled.div`
  background: var(--card-bg);
  width: 700px;
  max-width: 90vw;
  max-height: 80vh;
  border-radius: 12px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);

  .header {
    background: var(--bg-secondary);
    padding: 15px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      font-size: 1.1rem;
      margin: 0;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
`;

const CatalogList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CatalogItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: var(--input-bg);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--bg-hover, #2d2d2d);
    border-color: var(--primary);
    transform: translateX(2px);
  }

  @media (max-width: 500px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    .info { width: 100%; }
    
    .actions {
      width: 100%;
      justify-content: space-between;
      border-top: 1px solid var(--border);
      padding-top: 8px;
    }
  }

  .info {
    display: flex;
    flex-direction: column;
    
    strong {
      color: var(--text);
      font-size: 0.95rem;
      margin-bottom: 2px;
    }
    
    small {
      color: var(--text-secondary);
      font-size: 0.8rem;
      background: var(--bg-secondary);
      padding: 2px 6px;
      border-radius: 4px;
      width: fit-content;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 15px;

    .price {
      font-weight: 600;
      color: #2ECC71;
      font-size: 1rem;
      min-width: 70px;
      text-align: right;
    }

    button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;

      &:hover {
        filter: brightness(1.1);
      }
    }
  }
`;

/**
 * Invoice Builder Page
 * Core functionality for creating Invoices and Quotes.
 * Features:
 * - Dynamic Item Addition (Materials or Product Catalog)
 * - Automatic Sheet Cutting Calculation (Pieces x Length x Width -> Sheet Utilization)
 * - Real-time Stock Validation
 * - Quote to Invoice logic support
 */
const InvoiceMaker = () => {
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('orderId');
  
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [clientName, setClientName] = useState(location.state?.clientName || '');
  const [invoiceType, setInvoiceType] = useState('invoice');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [laborCost, setLaborCost] = useState(0);

  // Fetch data on load
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [matRes, prodRes] = await Promise.all([
                fetch(`${API_URL}/api/materials`),
                fetch(`${API_URL}/api/products`)
            ]);
            const mats = await matRes.json();
            const prods = await prodRes.json();
            setMaterials(mats);
            setProducts(prods);

            // If Editing, Fetch Invoice Details
            if (editId) {
                const invRes = await fetch(`${API_URL}/api/invoices/${editId}`);
                if (invRes.ok) {
                    const invData = await invRes.json();
                    setClientName(invData.client_name);
                    setInvoiceType(invData.type);
                    setLaborCost(invData.labor_cost);
                    
                    // Map Items
                    const mappedItems = invData.items.map(item => {
                        // Find if sheet logic applies
                        const relatedMat = mats.find(m => m.id === item.material_id);
                        const isSheet = relatedMat?.type === 'Sheet';
                        
                        return {
                            material_id: item.material_id || '',
                            description: item.description,
                            quantity_used: Number(item.quantity),
                            unit_price: Number(item.unit_price),
                            is_sheet_material: isSheet,
                            pieces: 0, // Cannot perfectly reverse eng without storing it
                            cut_length: Number(item.height || 0),
                            cut_width: Number(item.width || 0),
                            materials: [],
                            product_id: item.product_id || null,
                            is_product: !!item.product_id
                        };
                    });
                    setItems(mappedItems);
                    
                    if (invData.type === 'invoice') {
                        addToast("Warning: You are editing a processed invoice. This creates a new version.", "warning");
                    }
                } else {
                    addToast("Failed to load invoice details", "error");
                }
            }

        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };
    fetchData();
  }, [editId]);

  const addItem = () => {
    setItems([...items, { 
      material_id: '', 
      description: '', 
      quantity_used: 1, 
      unit_price: 0, 
      is_sheet_material: false,
      pieces: 1,
      cut_length: 0,
      cut_width: 0,
      materials: [], // Explicitly empty for Products (handled by backend recipe)
      product_id: null
    }]);
  };

  const addCatalogItem = (product) => {
      setItems([...items, {
          material_id: '', // Empty as it's a product
          product_id: product.id,
          description: product.name,
          quantity_used: 1,
          unit_price: product.base_price, // Use base price
          is_sheet_material: false,
          pieces: 1,
          cut_length: 0,
          cut_width: 0,
          is_product: true // Flag for UI
      }]);
      setShowCatalog(false);
  };

  /**
   * Update Item Logic
   * Handles changes to any invoice item (Material selection, dimensions, quantity).
   * Contains complex logic for:
   * 1. Stock Limit Checking (Warns if exceeding inventory)
   * 2. Sheet Cutting Calc (Calculates how much of a sheet is used based on parts)
   * 3. Price Recalculation
   */
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];

    // 1. Global Negative Check for Quantity (Products AND Materials)
    if (field === 'quantity_used') {
       if (value < 0) return; // Prevent negative input entirely
    }

    // Handle Quantity Limits (Only for Materials)
    if (field === 'quantity_used' && !item.is_product) {
      const currentMaterialId = item.material_id;
      const material = materials.find(m => m.id === currentMaterialId);
      if (material) {
        const enteredQty = parseFloat(value);
        if (enteredQty > material.quantity) {
          addToast(`Only ${material.quantity} ${material.unit} available in stock.`, 'warning');
          return;
        }
      }
    }

    // UX Refinement: Sheet Material Safety Checks
    if ((field === 'cut_length' || field === 'cut_width') && item.is_sheet_material) {
      const selectedMat = materials.find(m => m.id === item.material_id);
      if (selectedMat && selectedMat.length > 0 && selectedMat.width > 0) {
        const newVal = parseFloat(value) || 0;
        const otherVal = field === 'cut_length' ? (parseFloat(item.cut_width) || 0) : (parseFloat(item.cut_length) || 0);
        
        const sheetMax = Math.max(selectedMat.length, selectedMat.width);
        const sheetMin = Math.min(selectedMat.length, selectedMat.width);
        const cutMax = Math.max(newVal, otherVal);
        const cutMin = Math.min(newVal, otherVal);

        // Immediate check: Single dimension size
        if (newVal > sheetMax) {
           addToast(`Dimension ${newVal} exceeds sheet size (${sheetMax})`, 'error');
           return;
        }

        // Full Fit Check (if both dimensions exist)
        if (otherVal > 0) {
           if (cutMax > sheetMax || cutMin > sheetMin) {
              addToast(`Cut ${newVal}x${otherVal} cannot fit on sheet ${selectedMat.length}x${selectedMat.width}`, 'error');
              return;
           }
        }
      }
    }

    // Update Field
    item[field] = value;

    // Logic: Material Selection (Only if not product)
    if (field === 'material_id' && !item.is_product) {
      const selectedMat = materials.find(m => m.id === value);
      if (selectedMat) {
        item.description = selectedMat.name;
        item.unit_price = selectedMat.price;
        item.is_sheet_material = selectedMat.type === 'Sheet'; 
        item.quantity_used = 1; 
        
        // Reset Calc fields
        item.pieces = 1;
        item.cut_length = 0;
        item.cut_width = 0;
      }
    }

    // Logic: Dimensions Calculation
    if (['pieces', 'cut_length', 'cut_width'].includes(field)) {
      const selectedMat = materials.find(m => m.id === item.material_id);
      
      // Only calculate if material has valid dimensions
      if (selectedMat && selectedMat.length > 0 && selectedMat.width > 0) {
        const pcs = parseFloat(item.pieces) || 0;
        const cl = parseFloat(item.cut_length) || 0;
        const cw = parseFloat(item.cut_width) || 0;

        if (pcs > 0 && cl > 0 && cw > 0) {
          const sheetArea = selectedMat.length * selectedMat.width;
          const cutArea = pcs * cl * cw;
          const sheetsUsed = cutArea / sheetArea;
          
          item.quantity_used = sheetsUsed.toFixed(2);
          
          // Optional: Update description to include dims
          // item.description = `${selectedMat.name} (${pcs}x ${cl}x${cw})`;
        }
      }
    }

    setItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateRowTotal = (item) => {
    const qty = parseFloat(item.quantity_used) || 0;
    let billedQty = qty;
    if (item.is_sheet_material) {
      billedQty = Math.ceil(qty);
    }
    return (billedQty * item.unit_price).toFixed(2);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + parseFloat(calculateRowTotal(item)), 0);
  };

  /**
   * Save Invoice / Quote
   * Validates form and sends data to backend.
   * Handles server-side validation errors (like "Not enough stock").
   */
  const handleSave = async () => {
    // 1. Validate Client Name (Alphabetical only, allowing spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!clientName || !nameRegex.test(clientName)) {
      addToast("Please enter a valid client name (letters only).", "error");
      return;
    }

    if (items.length === 0) {
      addToast("Please add at least one item", "error");
      return;
    }

    // 2. Validate Labor Cost
    const labor = parseFloat(laborCost);
    if (isNaN(labor) || labor < 0) {
       addToast("Labor cost must be a positive number.", "error");
       return;
    }

    // 3. Validate Items
    for (const item of items) {
        const qty = parseFloat(item.quantity_used);
        
        // Positive Check
        if (isNaN(qty) || qty <= 0) {
            addToast(`Quantity for "${item.description || 'Unknown Item'}" must be positive.`, "error");
            return;
        }

        // Integer Check for Non-Sheet Materials
        // Note: Products act like Units, so they must be integers usually? 
        // User spec: "only if the type is "sheet" that it can be a float"
        if (!item.is_sheet_material && !Number.isInteger(qty)) {
             addToast(`Quantity for "${item.description}" must be a whole number (not a sheet).`, "error");
             return;
        }
    }

    setLoading(true);
    const subtotal = calculateSubtotal();
    const total = subtotal + labor;

    const payload = {
      client_id: '00000000-0000-0000-0000-000000000000', // Placeholder
      client_name: clientName, 
      type: invoiceType, // Pass the type
      total_amount: total.toFixed(2),
      labor_cost: labor.toFixed(2),
      items: items.map(item => ({
        ...item,
        quantity_used: parseFloat(item.quantity_used) || 0
      }))
    };

    try {
      const url = editId ? `${API_URL}/api/invoices/${editId}` : `${API_URL}/api/invoices`;
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        addToast(editId ? "Quote Updated Successfully!" : (invoiceType === 'quote' ? "Quote Saved Successfully!" : "Invoice Created Successfully!"), "success");
        setItems([]);
        setClientName('');
        setLaborCost(0);
        if (editId) navigate('/orders');
      } else {
        const err = await response.json();
        // Handle Stock Validation Errors
        if (err.errors && Array.isArray(err.errors)) {
            err.errors.forEach(e => addToast(e, "error"));
        } else {
            addToast("Error creating invoice: " + (err.message || err), "error");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      addToast("Failed to connect to server", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <TopSection>
        <InfoBlock>
          <label><Calendar size={16} /> Invoice Date</label>
          <div className="input-wrapper">
            <Calendar size={18} />
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </InfoBlock>

        <InfoBlock>
          <label><User size={16} /> Client Name</label>
          <div className="input-wrapper">
            <User size={18} />
            <input 
              type="text" 
              placeholder="Enter Client Name" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
        </InfoBlock>

        <InfoBlock style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <label><Layers size={16} /> Document Type</label>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Labor Cost ($)</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="0.00" 
                  value={laborCost}
                  onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (val < 0) return; // Block negative
                      setLaborCost(e.target.value);
                  }}
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px', borderRadius: '6px', width: '100px' }}
                />
             </div>
          </div>
           <div style={{ display: 'flex', gap: '40px', marginTop: '10px', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '8px', flexWrap: 'wrap' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: invoiceType === 'invoice' ? '700' : '400', color: invoiceType === 'invoice' ? '#2ECC71' : 'var(--text)', gap: '10px' }}>
                 <input 
                    type="radio" 
                    name="type" 
                    checked={invoiceType === 'invoice'} 
                    onChange={() => setInvoiceType('invoice')} 
                    style={{ width: 'auto' }}
                 />
                 Invoice (Immediate Stock Deduction)
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: invoiceType === 'quote' ? '700' : '400', color: invoiceType === 'quote' ? '#F39C12' : 'var(--text)', gap: '10px' }}>
                 <input 
                    type="radio" 
                    name="type" 
                    checked={invoiceType === 'quote'} 
                    onChange={() => setInvoiceType('quote')} 
                    style={{ width: 'auto' }}
                 />
                 Quote / Estimate (No Stock Deduction)
              </label>
           </div>
        </InfoBlock>
      </TopSection>

      <ItemsSection>
        <SectionHeader>
          <h3>Items & Services</h3>
          <div style={{display: 'flex', gap: '10px'}}>
            <AddProductBtn onClick={() => setShowCatalog(true)} style={{backgroundColor: '#8E44AD'}}>
                <Box size={18} /> Add from Catalog
            </AddProductBtn>
            <AddProductBtn onClick={addItem}>
                <Plus size={18} /> Add Material
            </AddProductBtn>
          </div>
        </SectionHeader>
        
        <Table>
          <TableHeader>
            <div>Item / Material</div>
            <div>Qty Used</div>
            <div>Unit Price</div>
            <div>Total</div>
            <div></div>
          </TableHeader>

          {items.map((item, index) => (
            <TableRow key={index}>
              <div>
                {item.is_product ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '4px' }}>
                        <div style={{ background: 'rgba(142, 68, 173, 0.1)', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                            <Box size={20} color="#8E44AD"/>
                        </div>
                        <div>
                            <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '1rem', display: 'block' }}>{item.description}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8E44AD' }}></span>
                               Catalog Item
                            </span>
                        </div>
                    </div>
                ) : (
                    <select 
                    value={item.material_id} 
                    onChange={(e) => updateItem(index, 'material_id', e.target.value)}
                    >
                    <option value="">Select Material...</option>
                    {materials.map(m => (
                        <option key={m.id} value={m.id}>
                        {m.name} ({m.unit}) - Stock: {m.quantity}
                        </option>
                    ))}
                    </select>
                )}
                {item.is_sheet_material && (
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                    Sheet Size: {materials.find(m => m.id === item.material_id)?.length} x {materials.find(m => m.id === item.material_id)?.width} cm
                  </div>
                )}
              </div>
              <div>
                {/* Dimensions Calculator for Sheets */}
                {item.is_sheet_material && 
                 materials.find(m => m.id === item.material_id)?.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                    <input 
                      type="number" placeholder="#" title="Pieces"
                      value={item.pieces}
                      onChange={(e) => updateItem(index, 'pieces', e.target.value)}
                      style={{ width: '40px', padding: '6px' }}
                    />
                    <input 
                      type="number" placeholder="L" title="Length (cm)"
                      value={item.cut_length}
                      onChange={(e) => updateItem(index, 'cut_length', e.target.value)}
                      style={{ width: '50px', padding: '6px' }}
                    />
                    <input 
                      type="number" placeholder="W" title="Width (cm)"
                      value={item.cut_width}
                      onChange={(e) => updateItem(index, 'cut_width', e.target.value)}
                      style={{ width: '50px', padding: '6px' }}
                    />
                  </div>
                )}

                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max={!item.is_product ? materials.find(m => m.id === item.material_id)?.quantity : undefined}
                  value={item.quantity_used} 
                  onChange={(e) => updateItem(index, 'quantity_used', e.target.value)}
                />
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                   {!item.is_product && `Max: ${materials.find(m => m.id === item.material_id)?.quantity || 0}`}
                </div>
                {item.is_sheet_material && item.quantity_used > 0 && (
                  <div className="scrap-info">
                    Billed: {Math.ceil(Number(item.quantity_used))} <br/>
                    Scrap: +{(Math.ceil(Number(item.quantity_used)) - Number(item.quantity_used)).toFixed(2)}
                  </div>
                )}
              </div>
              <div>${item.unit_price}</div>
              <div>${calculateRowTotal(item)}</div>
              <Trash2 
                size={18} 
                color="#ff5555" 
                style={{ cursor: 'pointer' }} 
                onClick={() => removeItem(index)}
              />
            </TableRow>
          ))}
          
          {items.length === 0 && (
            <EmptyState>
              <Plus size={48} color="#333" />
              <p>No items added yet. Click "Add Product" to start building your invoice.</p>
            </EmptyState>
          )}
        </Table>

        <Footer>
          <LeftActions>
            <button className="create-btn" onClick={handleSave} disabled={loading} style={{ backgroundColor: invoiceType === 'quote' ? '#F39C12' : '#27AE60' }}>
              <CheckCircle size={20} /> 
              {loading ? 'Processing...' : (editId ? 'Update & Save' : (invoiceType === 'quote' ? 'Save Quote' : 'Create & Finalize Invoice'))}
            </button>
            <button className="cancel-btn" onClick={() => { setItems([]); if(editId) navigate('/orders'); }}>
              <X size={18} /> {editId ? 'Cancel Edit' : 'Clear Form'}
            </button>
          </LeftActions>

          <Summary>
            <div className="row">
              <span>Materials Cost</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="row" style={{ alignItems: 'center' }}>
              <span>Labor / Service</span>
              <input 
                type="number" 
                min="0"
                value={laborCost} 
                onChange={(e) => setLaborCost(e.target.value)}
                style={{ 
                  background: 'var(--input-bg)', 
                  border: '1px solid var(--border)', 
                  color: 'var(--text)',
                  textAlign: 'right',
                  width: '100px',
                  padding: '6px',
                  borderRadius: '6px',
                  outline: 'none'
                }}
              />
            </div>
            <div className="row total">
              <span>Total</span>
              <span>${(calculateSubtotal() + (parseFloat(laborCost) || 0)).toFixed(2)}</span>
            </div>
          </Summary>
        </Footer>
      </ItemsSection>

      {showCatalog && (
        <CatalogOverlay onClick={() => setShowCatalog(false)}>
            <CatalogModal onClick={e => e.stopPropagation()}>
                <div className="header">
                    <h3><Box size={20} color="#8E44AD"/> Product Catalog</h3>
                    <button 
                        onClick={() => setShowCatalog(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <CatalogList>
                    {products.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                            No products found in catalog. Create one in the "Products" tab first.
                        </p>
                    ) : (
                        products.map(product => (
                            <CatalogItem key={product.id} onClick={() => addCatalogItem(product)}>
                                <div className="info">
                                    <strong>{product.name}</strong>
                                    <small>{product.material_count || 0} ingredients</small>
                                </div>
                                <div className="actions">
                                    <span className="price">
                                        ${Number(product.base_price || 0).toFixed(2)}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); addCatalogItem(product); }}>
                                        Add
                                    </button>
                                </div>
                            </CatalogItem>
                        ))
                    )}
                </CatalogList>
            </CatalogModal>
        </CatalogOverlay>
      )}
    </Container>
  );
};

export default InvoiceMaker;
