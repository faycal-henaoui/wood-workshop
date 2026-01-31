import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ShoppingCart, Plus, Save, Trash2, Search, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { API_URL } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  color: var(--text);
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 { font-size: 1.8rem; display: flex; align-items: center; gap: 12px; }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

const Card = styled.div`
  background: var(--card-bg);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border);

  @media (max-width: 600px) {
    padding: 15px;
  }
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label { font-size: 0.9rem; color: var(--text-secondary); font-weight: 500; }
  input {
    background: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 10px;
    border-radius: 8px;
    outline: none;
    &:focus { border-color: var(--primary); }
  }
`;

const Table = styled.div`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  overflow-x: auto; /* Allow Scroll */
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 50px;
  gap: 10px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 700px; /* Force minimum width */
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 50px;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid var(--border);
  align-items: center;
  background: var(--card-bg);
  min-width: 700px; /* Force minimum width */

  select, input {
    background: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px;
    border-radius: 6px;
    width: 100%;
  }
`;

const Btn = styled.button`
  background: ${props => props.$primary ? 'var(--primary)' : 'var(--input-bg)'};
  color: ${props => props.$primary ? 'white' : 'var(--text)'};
  border: 1px solid ${props => props.$primary ? 'transparent' : 'var(--border)'};
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover { filter: brightness(1.1); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

/**
 * Purchases Page
 * Manages the "Restocking" process.
 * Allows users to record purchases of RAW MATERIALS from suppliers.
 * Logic: When a purchase is saved, the Stock Quantity of the items is INCREASED.
 */
const Purchases = () => {
    const { addToast } = useToast();
    const [materials, setMaterials] = useState([]);
    const [supplier, setSupplier] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/api/materials`)
            .then(res => res.json())
            .then(data => setMaterials(data))
            .catch(err => console.error(err));
    }, []);

    const addItem = () => {
        setItems([...items, { id: '', name: '', quantity: 1, unit_price: 0, isNew: false, type: 'Standard', unit: 'pcs', length: 0, width: 0 }]);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        const item = newItems[index];

        if (field === 'id') {
            if (value === 'new') {
                item.isNew = true;
                item.id = '';
                item.name = '';
                item.type = 'Standard';
                item.unit = 'pcs';
                item.length = 0;
                item.width = 0;
            } else {
                const mat = materials.find(m => m.id == value);
                item.isNew = false;
                item.id = value;
                item.name = mat ? mat.name : '';
                if (mat) {
                    item.type = mat.type || 'Standard';
                    item.unit = mat.unit || 'pcs';
                }
            }
        } else {
            item[field] = value;
        }
        setItems(newItems);
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    /**
     * Save Purchase
     * Submits the purchase order.
     * KEY LOGIC: Triggers backend to increment stock levels for all listed items.
     */
    const handleSave = async () => {
        if (!supplier || items.length === 0) {
            addToast("Please fill supplier name and add at least one item.", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/purchases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_name: supplier,
                    items: items,
                    purchase_date: purchaseDate
                })
            });
            
            if (res.ok) {
                addToast("Purchase recorded and Stock updated!", "success");
                setSupplier('');
                setItems([]);
                // Keep the date as is or reset? Usually convenient to keep it or reset to today. 
                // Let's reset to today to avoid accidental backdating for next entry
                setPurchaseDate(new Date().toISOString().split('T')[0]);
            } else {
                const errorData = await res.json();
                console.error("Purchase Error Details:", errorData);
                addToast(`Error: ${errorData.error || "Saving failed"}`, "error");
            }
        } catch (err) {
            console.error(err);
            addToast("Server Error", "error");
        } finally {
            setLoading(false);
        }
    };

    const grandTotal = items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)), 0);

    return (
        <Container>
            <Header>
                <h1><ShoppingCart size={28} /> Supplier Invoices & Purchases</h1>
                <Btn $primary onClick={handleSave} disabled={loading}>
                    <Save size={18} /> {loading ? 'Processing...' : 'Save & Update Stock'}
                </Btn>
            </Header>

            <Card>
                <InputGroup>
                    <Field>
                        <label>Supplier / Seller Name</label>
                        <input 
                            placeholder="e.g. Sarl Wood Import" 
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                        />
                    </Field>
                    <Field>
                         <label>Date</label>
                         <input 
                            type="date" 
                            value={purchaseDate} 
                            onChange={(e) => setPurchaseDate(e.target.value)}
                         />
                    </Field>
                </InputGroup>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Items Purchased</h3>
                    <Btn onClick={addItem}><Plus size={16} /> Add Row</Btn>
                </div>

                <Table>
                    <TableHeader>
                        <div>Material</div>
                        <div>Type / Unit</div>
                        <div>Quantity</div>
                        <div>Unit Price (Purchase)</div>
                        <div>Total Line</div>
                        <div></div>
                    </TableHeader>
                    
                    {items.map((item, index) => (
                        <TableRow key={index}>
                            <div>
                                {item.isNew ? (
                                    <div style={{display: 'flex', gap: '5px'}}>
                                        <input 
                                            placeholder="Enter New Material Name"
                                            value={item.name}
                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={() => updateItem(index, 'id', '')} title="Cancel New">x</button>
                                    </div>
                                ) : (
                                    <select 
                                        value={item.id}
                                        onChange={(e) => updateItem(index, 'id', e.target.value)}
                                    >
                                        <option value="">Select Material...</option>
                                        <option value="new" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Create New Material</option>
                                        {materials.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} (Current: ${m.price})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                {item.isNew ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <select 
                                            value={item.unit}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateItem(index, 'unit', val);
                                                if(val === 'sheet') updateItem(index, 'type', 'Sheet');
                                                else updateItem(index, 'type', 'Standard');
                                            }}
                                        >
                                            <option value="pcs">Piece (Standard)</option>
                                            <option value="sheet">Sheet</option>
                                            <option value="box">Box</option>
                                            <option value="m">Meter</option>
                                            <option value="kg">Kg</option>
                                            <option value="l">Liter</option>
                                        </select>
                                        {item.unit === 'sheet' && (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <input 
                                                    type="number" 
                                                    placeholder="L (cm)" 
                                                    value={item.length || ''} 
                                                    onChange={(e) => updateItem(index, 'length', parseFloat(e.target.value))}
                                                    style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }} 
                                                />
                                                <input 
                                                    type="number" 
                                                    placeholder="W (cm)" 
                                                    value={item.width || ''} 
                                                    onChange={(e) => updateItem(index, 'width', parseFloat(e.target.value))}
                                                    style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ padding: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'var(--input-bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                        {item.type === 'Sheet' ? 'Sheet' : (item.unit || 'pcs')}
                                    </div>
                                )}
                            </div>
                            <div>
                                <input 
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                />
                            </div>
                            <div>
                                <input 
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unit_price}
                                    onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                />
                            </div>
                            <div style={{ fontWeight: 'bold' }}>
                                ${(item.quantity * item.unit_price).toFixed(2)}
                            </div>
                            <Trash2 
                                size={18} 
                                color="#e74c3c" 
                                style={{ cursor: 'pointer' }}
                                onClick={() => removeItem(index)}
                            />
                        </TableRow>
                    ))}
                    {items.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No items added. Click "Add Row" to start.
                        </div>
                    )}
                </Table>
                
                <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Total Invoice: <span style={{ color: '#27ae60' }}>${grandTotal.toFixed(2)}</span>
                </div>
            </Card>

            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '8px', border: '1px solid #3498db', color: '#3498db', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <AlertTriangle size={20} />
                <span>
                    <strong>Note:</strong> Saving this purchase will automatically increase your stock levels. 
                    The material price will be updated using the <em>Weighted Average Cost</em> method to reflect the new purchase price.
                </span>
            </div>
        </Container>
    );
};

export default Purchases;
