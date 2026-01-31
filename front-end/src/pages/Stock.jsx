import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Package, AlertTriangle, Search, Plus, Filter, Layers, Trash2, X } from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useConfirmation } from '../context/ConfirmationProvider';
import { API_URL } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #e0e0e0;
  font-family: 'Inter', sans-serif;
  height: 100%;
  position: relative;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: var(--card-bg);
  padding: 30px;
  border-radius: 12px;
  width: 400px;
  border: 1px solid var(--border);
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);

  h3 {
    margin-top: 0;
    color: var(--white);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  @media (max-width: 500px) {
    width: 95vw;
    padding: 20px;
    
    /* Force flex containers to stack */
    form > div[style*="display: flex"] {
      flex-direction: column !important;
      gap: 15px !important;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 20px;

    input, select {
      background: var(--input-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 12px;
      border-radius: 8px;
      outline: none;
      &:focus { border-color: #E67E22; }
    }

    button {
      background: #E67E22;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 10px;
      &:hover { background: #D35400; }
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg);
  padding: 15px 25px;
  border-radius: 12px;
  border: 1px solid var(--border);

  h2 {
    font-size: 1.5rem;
    color: var(--white);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    h2 { font-size: 1.25rem; }
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;

  .search-box {
    display: flex;
    align-items: center;
    background-color: var(--input-bg);
    border-radius: 8px;
    padding: 0 15px;
    border: 1px solid var(--border);
    width: 300px;

    input {
      background: transparent;
      border: none;
      color: var(--text);
      padding: 10px;
      width: 100%;
      outline: none;
      &::placeholder { color: var(--text); opacity: 0.6; }
    }
  }

  button {
    background-color: #E67E22;
    border: none;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: 0.2s;

    &:hover { background-color: #D35400; }
    
    &.secondary {
      background-color: var(--input-bg);
      border: 1px solid var(--border);
      color: var(--text);
      &:hover { background-color: var(--border); color: var(--white); }
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    
    .search-box {
      width: 100%;
    }
    
    button {
      justify-content: center;
    }
    
    /* Wrap buttons container */
    div {
      width: 100%;
      display: flex;
      gap: 10px;
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
  
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
    /* When stacked, we might want the scroll area behavior to change or disappear */
    overflow-y: auto; 
  }
`;

const Section = styled.div`
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: hidden;

  h3 {
    font-size: 1.1rem;
    color: var(--white);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding-right: 5px;

  &::-webkit-scrollbar { width: 6px; height: 6px; }
  &::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 3px; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  th {
    text-align: left;
    color: var(--text);
    padding: 12px 15px;
    font-weight: 600;
    border-bottom: 1px solid var(--border);
    opacity: 0.8;
  }

  td {
    padding: 15px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
  }

  tr:last-child td { border-bottom: none; }
  
  tr:hover td {
    background-color: var(--input-bg);
  }
`;

const Badge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  
  ${props => props.$low ? `
    background-color: rgba(231, 76, 60, 0.15);
    color: #E74C3C;
    border: 1px solid rgba(231, 76, 60, 0.3);
  ` : `
    background-color: rgba(46, 204, 113, 0.15);
    color: #2ECC71;
    border: 1px solid rgba(46, 204, 113, 0.3);
  `}
`;

const ScrapCard = styled.div`
  background-color: var(--input-bg);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    strong { color: var(--white); font-size: 0.95rem; }
    span { color: var(--text); font-size: 0.8rem; opacity: 0.8; }
  }

  .qty {
    font-weight: bold;
    color: #E67E22;
    background: rgba(230, 126, 34, 0.1);
    padding: 5px 10px;
    border-radius: 6px;
  }
`;

const FilterMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10;
  width: 150px;

  button {
    background: transparent;
    border: none;
    color: var(--text);
    padding: 8px 12px;
    text-align: left;
    border-radius: 4px;
    cursor: pointer;
    font-weight: normal;
    
    &:hover {
      background-color: var(--input-bg);
    }
    
    &.active {
      background-color: rgba(230, 126, 34, 0.2);
      color: #E67E22;
      font-weight: 600;
    }
  }
`;

/**
 * Stock Management Page
 * Manages Raw Materials (Sheets, Profiles, etc.) and Scrap items.
 * Allows adding, editing, and deleting materials.
 * Includes filtering and low-stock indicators.
 */
const Stock = () => {
  const { addToast } = useToast();
  const { requestConfirmation } = useConfirmation();
  const [materials, setMaterials] = useState([]);
  const [scrap, setScrap] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    type: '',
    quantity: 0,
    unit: '',
    price: 0,
    low_stock_threshold: 5,
    length: 0,
    width: 0 
  });

  /**
   * Fetch Raw Materials
   * Gets list of full-sized materials from inventory.
   */
  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/materials`);
      const data = await res.json();
      setMaterials(data);
    } catch (error) {
  /**
   * Fetch Scrap
   * Gets list of usable scrap pieces (off-cuts).
   */
      console.error('Error fetching materials:', error);
    }
  }, []);

  const fetchScrap = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/scrap`);
      const data = await res.json();
      setScrap(data);
    } catch (error) {
  /**
   * Fetch Material Types
   * Gets configured categories (e.g. Sheet, Profile) from settings.
   */
      console.error('Error fetching scrap:', error);
    }
  }, []);

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/types`);
      const data = await res.json();
      setMaterialTypes(data);
      
      if (data.length > 0) {
        setNewMaterial(prev => {
          if (!prev.type) {
            return { ...prev, type: data[0].name, unit: data[0].unit };
          }
          return prev;
        });
      }
    } catch(err) { console.error('Error fetching types:', err); }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchMaterials(),
        fetchScrap(),
        fetchTypes()
      ]);
  /**
   * Save Material
   * Handles Create/Update logic for materials.
   * Refreshes both materials and scrap lists after save.
   */
    };
    loadData();
  }, [fetchMaterials, fetchScrap, fetchTypes]);

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    const url = newMaterial.id 
      ? `${API_URL}/api/materials/${newMaterial.id}`
      : `${API_URL}/api/materials`;
    
    const method = newMaterial.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMaterial)
      });
      if (response.ok) {
        addToast("Material saved successfully", "success");
        fetchMaterials();
        fetchScrap();
        setShowModal(false);
        setNewMaterial({ name: '', type: 'Sheet', quantity: 0, unit: 'sheets', price: 0, low_stock_threshold: 5 });
      } else {
        addToast("Error saving material", "error");
      }
    } catch (error) {
      console.error('Error saving material:', error);
      addToast("Server Error", "error");
    }
  };

  const handleEditClick = (material) => {
    setNewMaterial(material);
    setShowModal(true);
  };

  /**
   * Delete Material
   * Confirms and removes a raw material entry.
   */
  const handleAddClick = () => {
    setNewMaterial({ name: '', type: 'Sheet', quantity: 0, unit: 'sheets', price: 0, low_stock_threshold: 5, length: 0, width: 0 });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    console.log("Using ConfirmationProvider for delete");
    requestConfirmation({
      title: 'Delete Material',
      message: 'Are you sure you want to delete this material? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await fetch(`${API_URL}/api/materials/${id}`, { method: 'DELETE' });
          addToast("Material deleted successfully", "success");
          fetchMaterials();
        } catch (error) {
          console.error('Error deleting material:', error);
          addToast("Error deleting material", "error");
        }
      }
    });
  };

  const handleDeleteScrap = (id) => {
    requestConfirmation({
      title: 'Delete Scrap',
      message: 'Are you sure you want to delete this scrap item? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await fetch(`${API_URL}/api/scrap/${id}`, { method: 'DELETE' });
          addToast("Scrap item deleted successfully", "success");
          fetchScrap();
        } catch (error) {
          console.error('Error deleting scrap:', error);
          addToast("Error deleting scrap", "error");
        }
      }
    });
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterType === 'All' || m.type === filterType)
  );

  return (
    <Container>
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <h3>{newMaterial.id ? 'Edit Material' : 'Add New Material'} <X size={20} style={{cursor: 'pointer'}} onClick={() => setShowModal(false)} /></h3>
            <form onSubmit={handleSaveMaterial}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text)', opacity: 0.7 }}>Material Name</label>
                <input 
                  placeholder="Material Name" 
                  value={newMaterial.name}
                  onChange={e => setNewMaterial({...newMaterial, name: e.target.value})}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text)', opacity: 0.7 }}>Type</label>
                <select 
                  value={newMaterial.type}
                  onChange={e => {
                      const selected = materialTypes.find(t => t.name === e.target.value);
                      setNewMaterial({
                          ...newMaterial, 
                          type: e.target.value,
                          unit: selected ? selected.unit : newMaterial.unit 
                      });
                  }}
                  style={{ width: '100%' }}
                >
                   {materialTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                   ))}
                </select>
              </div>

              {newMaterial.type === 'Sheet' && (
                <div style={{display: 'flex', gap: '15px', marginBottom: '15px', backgroundColor: 'rgba(230, 126, 34, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid #E67E22'}}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#E67E22', fontWeight: 'bold' }}>Length (cm)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 280" 
                      value={newMaterial.length}
                      onChange={e => setNewMaterial({...newMaterial, length: parseFloat(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#E67E22', fontWeight: 'bold' }}>Width (cm)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 130" 
                      value={newMaterial.width}
                      onChange={e => setNewMaterial({...newMaterial, width: parseFloat(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text)', opacity: 0.7 }}>Quantity</label>
                  <input 
                    type="number" 
                    placeholder="Quantity" 
                    value={newMaterial.quantity}
                    onChange={e => setNewMaterial({...newMaterial, quantity: parseInt(e.target.value)})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text)', opacity: 0.7 }}>Unit</label>
                  <input 
                    placeholder="Unit (e.g. sheets, pcs)" 
                    value={newMaterial.unit}
                    onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text)', opacity: 0.7 }}>Price per Unit</label>
                  <input 
                    type="number" 
                    placeholder="Price per Unit" 
                    value={newMaterial.price}
                    onChange={e => setNewMaterial({...newMaterial, price: parseFloat(e.target.value)})}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text)', opacity: 0.7 }}>Low Stock Alert</label>
                  <input 
                    type="number" 
                    placeholder="Low Stock Alert at" 
                    value={newMaterial.low_stock_threshold}
                    onChange={e => setNewMaterial({...newMaterial, low_stock_threshold: parseInt(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <button type="submit" style={{ width: '100%' }}>{newMaterial.id ? 'Update Material' : 'Save Material'}</button>
            </form>
          </Modal>
        </ModalOverlay>
      )}

      <Header>
        <h2><Package size={24} color="#E67E22" /> Stock Management</h2>
        <Controls>
          <div className="search-box">
            <Search size={18} color="#666" />
            <input 
              type="text" 
              placeholder="Search materials..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{position: 'relative'}}>
            <button 
              className="secondary" 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              style={showFilterMenu || filterType !== 'All' ? {backgroundColor: 'rgba(230, 126, 34, 0.2)', color: '#E67E22', borderColor: '#E67E22'} : {}}
            >
              <Filter size={18} /> {filterType === 'All' ? 'Filter' : filterType}
            </button>
            {showFilterMenu && (
              <FilterMenu>
                <button className={filterType === 'All' ? 'active' : ''} onClick={() => { setFilterType('All'); setShowFilterMenu(false); }}>All Types</button>
                {materialTypes.map(type => (
                  <button 
                    key={type.id}
                    className={filterType === type.name ? 'active' : ''} 
                    onClick={() => { setFilterType(type.name); setShowFilterMenu(false); }}
                  >
                    {type.name}
                  </button>
                ))}
              </FilterMenu>
            )}
          </div>
          <button onClick={handleAddClick}><Plus size={18} /> Add Material</button>
        </Controls>
      </Header>

      <Grid>
        {/* Main Inventory Section */}
        <Section>
          <h3><Layers size={20} /> Main Inventory</h3>
          <ScrollArea>
          <Table>
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map(m => (
                <tr key={m.id} onClick={() => handleEditClick(m)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ fontWeight: '500', color: 'var(--text)' }}>{m.name}</div>
                    {m.type === 'Sheet' && Number(m.length) > 0 && Number(m.width) > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#E67E22', marginTop: '2px' }}>
                        {Number(m.length)} x {Number(m.width)} cm
                      </div>
                    )}
                  </td>
                  <td>{m.type}</td>
                  <td>{m.quantity}</td>
                  <td>{m.unit}</td>
                  <td>
                    {m.quantity <= m.low_stock_threshold ? (
                      <Badge $low><AlertTriangle size={12} /> Low Stock</Badge>
                    ) : (
                      <Badge>In Stock</Badge>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Trash2 
                      size={16} 
                      color="#666" 
                      style={{ cursor: 'pointer' }} 
                      onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          </ScrollArea>
        </Section>

        {/* Scrap Section */}
        <Section>
          <h3><Package size={20} /> Scrap & Offcuts</h3>
          <ScrollArea>
            {scrap.map(s => (
              <ScrapCard key={s.id}>
                <div className="info">
                  <strong>{s.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text)', opacity: 0.7, margin: '4px 0' }}>
                     {s.dimensions && s.dimensions !== 'Unknown' ? (
                       <span style={{ color: '#E67E22', fontWeight: 'bold' }}>{s.dimensions} cm</span>
                     ) : (
                       <span style={{ fontStyle: 'italic' }}>Dimensions Unknown</span>
                     )}
                  </div>
                  <span>{s.notes || 'No notes'} • {new Date(s.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="qty">{s.quantity}</div>
                  <Trash2 
                    size={16} 
                    color="#666" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleDeleteScrap(s.id)}
                  />
                </div>
              </ScrapCard>
            ))}
            {scrap.length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                No scrap items found.
              </div>
            )}
          </ScrollArea>
        </Section>
      </Grid>
    </Container>
  );
};

export default Stock;
