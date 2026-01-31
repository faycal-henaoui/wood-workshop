import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Search, Plus, Box, Ruler, Save, Calculator, Package, Layers, Trash2, X, Edit, Settings } from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useConfirmation } from '../context/ConfirmationProvider';
import { API_URL } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  color: var(--text);
  font-family: 'Inter', sans-serif;

  @media (max-width: 768px) {
    gap: 15px;
    height: auto; /* Allow scrolling on mobile */
    min-height: 100vh;
  }
`;

// --- Modal Styles ---
const Overlay = styled.div`
  position: fixed;
  top: 0; 
  left: 0;
  right: 0; 
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const Modal = styled.div`
  background: var(--card-bg);
  width: 900px;
  max-width: 95vw;
  max-height: 90vh;
  border-radius: 16px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  overflow: hidden;

  .header {
    padding: 20px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    h2 { margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; }
  }

  .body {
    padding: 25px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr; /* Stack modal inputs */
      padding: 15px;
      gap: 15px;
    }
  }
  
  .footer {
    padding: 20px; 
    border-top: 1px solid var(--border);
    background: var(--bg-secondary);
    display: flex;
    justify-content: flex-end;
    gap: 15px;

    @media (max-width: 500px) {
       flex-direction: column;
       button { width: 100%; justify-content: center; }
    }
  }
`;
// --------------------

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

const TitleSection = styled.div`
  h1 {
    font-size: 1.8rem;
    color: var(--text);
    margin-bottom: 5px;
  }
  p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 15px;

  @media (max-width: 768px) {
    width: 100%;
    flex-wrap: wrap;
    
    /* Make the category filter expand */
    select {
      flex: 1;
    }
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background-color: var(--input-bg);
  border-radius: 8px;
  padding: 0 15px;
  width: 300px;
  border: 1px solid var(--border);

  @media (max-width: 768px) {
    width: 100%;
    order: 3; /* Move search bar to bottom of header actions if needed, or just let it flow */
    margin-top: 10px;
  }

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

const Button = styled.button`
  background-color: ${props => props.$primary ? 'var(--primary)' : 'var(--input-bg)'};
  color: ${props => props.$primary ? 'white' : 'var(--text-secondary)'};
  border: ${props => props.$primary ? 'none' : '1px solid var(--border)'};
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr; /* Stack panels */
    height: auto;
    
    /* Give the first panel (list) a fixed height so it doesn't take up the whole screen */
    & > div:first-child {
      height: 400px; 
    }
  }
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background-color: ${props => props.$primary ? '#D35400' : 'var(--bg-secondary)'};
    color: ${props => props.$primary ? 'white' : 'var(--text)'};
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 25px;
  height: calc(100vh - 140px);
`;

const Panel = styled.div`
  background-color: var(--card-bg);
  border-radius: 16px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const ProductList = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 10px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 3px; }
`;

const ProductItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: 0.2s;
  border-radius: 8px;

  &:hover {
    background-color: var(--bg-secondary);
  }

  .info {
    h4 { color: var(--text); margin-bottom: 4px; font-size: 0.95rem; }
    span { color: var(--text-secondary); font-size: 0.8rem; display: block; }
  }

  .price {
    font-weight: bold;
    color: #27ae60;
  }
`;

const BuilderContent = styled.div`
  padding: 25px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 600;
  }

  input, select {
    background-color: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 12px;
    border-radius: 8px;
    outline: none;
    
    &:focus { border-color: var(--primary); }
  }
`;

const VisualPreview = styled.div`
  background-color: var(--bg-secondary);
  border-radius: 12px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--border);
  color: var(--text-secondary);
  flex-direction: column;
  gap: 10px;
  
  svg { opacity: 0.5; }
`;

const CostSummary = styled.div`
  background-color: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 0.9rem;
    color: var(--text-secondary);

    &.total {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid var(--border);
      color: var(--text);
      font-weight: bold;
      font-size: 1.1rem;
      margin-bottom: 0;
    }
  }
`;

const CategoryFilter = styled.select`
  background-color: var(--input-bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 10px 15px;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  
  &:focus { border-color: var(--primary); }
`;

/**
 * Product Manager
 * Manages "Recipes" for complex products.
 * Allows defining a product as a collection of raw materials with specific dimensions.
 * Calculates base price automatically based on material costs + labor.
 */
const Products = () => {
  const { addToast } = useToast();
  const { requestConfirmation } = useConfirmation();
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]); // Dynamic Categories
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Category Manager State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editMat, setEditMat] = useState({ id: '', quantity: 0, cut_length: 0, cut_width: 0 });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '', // Will default to first available
    labor_cost: 0,
    materials: [] 
  });
  
  // Temporary state for adding a material line
  const [currentMat, setCurrentMat] = useState({
      id: '',
      quantity: 0,
      cut_length: 0,
      cut_width: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
    fetchCategories();
  }, []);

  const fetchProducts = () => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  };

  const fetchMaterials = () => {
    fetch(`${API_URL}/api/materials`)
      .then(res => res.json())
      .then(data => setMaterials(data))
      .catch(err => console.error(err));
  };

  const fetchCategories = () => {
    fetch(`${API_URL}/api/products/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        // Set default category if not set
        if (!formData.category && data.length > 0) {
            setFormData(prev => ({ ...prev, category: data[0].name }));
        }
      })
      .catch(err => console.error(err));
  };

  /**
   * Category Management
   * CRUD operations for Product Categories.
   */
  const handleAddCategory = async () => {
      if (!newCatName.trim()) return;
      try {
          const res = await fetch(`${API_URL}/api/products/categories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newCatName.trim() })
          });
          if (res.ok) {
              addToast('Category added', 'success');
              setNewCatName('');
              fetchCategories();
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleUpdateCategory = async (id) => {
      if (!editCatName.trim()) return;
      try {
          const res = await fetch(`${API_URL}/api/products/categories/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: editCatName.trim() })
          });
          if (res.ok) {
              addToast('Category updated', 'success');
              setEditingCatId(null);
              setEditCatName('');
              fetchCategories();
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleDeleteCategory = (id) => {
      requestConfirmation({
          title: 'Delete Category',
          message: 'Are you sure? This might affect products using this category.',
          onConfirm: async () => {
            try {
                const res = await fetch(`${API_URL}/api/products/categories/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    addToast('Category deleted', 'success');
                    fetchCategories();
                }
            } catch (err) {
                console.error(err);
            }
          }
      });
  };
  // ---------------------------

  // --- Edit Logic ---
  const handleEditClick = async (product) => {
    try {
        const res = await fetch(`${API_URL}/api/products/${product.id}`);
        const data = await res.json();
        
        // Transform for editor
        const transformed = {
            ...data,
            materials: data.materials.map(m => ({
                id: m.material_id, // Important: use generic 'id' for mapping to UI or 'material_id' for saving
                material_id: m.material_id,
                quantity_required: Number(m.quantity_required),
                cut_length: Number(m.cut_length || 0),
                cut_width: Number(m.cut_width || 0),
                // Helper fields for display
                name: m.name,
                price: Number(m.price),
                type: m.type,
                unit: m.unit
            }))
        };
        setEditingProduct(transformed);
        setShowEditModal(true);
    } catch (err) {
        console.error("Failed to load product details", err);
  /**
   * Update Product
   * Saves changes to a product recipe.
   * AUTO-CALCULATION: Re-calculates 'base_price' based on current material costs.
   */
    }
  };

  const handleUpdateProduct = async () => {
      if (!editingProduct) return;
      
      // Calculate new base price
      const matCost = editingProduct.materials.reduce((acc, item) => {
        const mat = materials.find(m => m.id === item.material_id);
        if (!mat) return acc;
        let cost = 0;
        if (mat.type === 'Sheet' && item.cut_length > 0 && item.cut_width > 0 && mat.length > 0 && mat.width > 0) {
            const partArea = item.cut_length * item.cut_width;
            const sheetArea = mat.length * mat.width;
            cost = (partArea / sheetArea) * mat.price * item.quantity_required;
        } else {
            cost = mat.price * item.quantity_required;
        }
        return acc + cost;
      }, 0);

      const payload = {
          ...editingProduct,
          base_price: matCost + Number(editingProduct.labor_cost)
      };

      try {
          const res = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              addToast('Product updated successfully', 'success');
              fetchProducts();
              setShowEditModal(false);
          }
      } catch (err) {
          console.error("Update failed", err);
      }
  };

  const addMatToEdit = () => {
      const qty = parseFloat(editMat.quantity);
      if (!editMat.id || isNaN(qty) || qty <= 0) return;
      
      // Use loose equality to match string ID from select with number ID from DB
      const mat = materials.find(m => m.id == editMat.id);
      if (!mat) return;

      const newItem = {
          material_id: mat.id,
          quantity_required: qty,
          cut_length: parseFloat(editMat.cut_length || 0),
          cut_width: parseFloat(editMat.cut_width || 0),
          name: mat.name,
          price: Number(mat.price),
          type: mat.type,
          unit: mat.unit
      };

      setEditingProduct(prev => ({
          ...prev,
          materials: [...prev.materials, newItem]
      }));
      setEditMat({ id: '', quantity: 0, cut_length: 0, cut_width: 0 });
  };
  // ------------------

  const handleDelete = (id, e) => {
    e.stopPropagation();
    requestConfirmation({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await fetch(`${API_URL}/api/products/${id}`, { method: 'DELETE' });
          addToast('Product successfully deleted', 'success');
          fetchProducts();
        } catch (err) {
          console.error('Error deleting product:', err);
          addToast('Error deleting product', 'error');
        }
      }
    });
  };

  const calculateMaterialCost = () => {
    return formData.materials.reduce((acc, item) => {
        const mat = materials.find(m => m.id === item.material_id);
        if (!mat) return acc;
        
        let cost = 0;
        if (mat.type === 'Sheet' && item.cut_length > 0 && item.cut_width > 0 && mat.length > 0 && mat.width > 0) {
            // Calculate Fraction of Sheet used
            const partArea = item.cut_length * item.cut_width;
            const sheetArea = mat.length * mat.width;
            const sheetFraction = partArea / sheetArea;
            // Cost is fraction * price * qty
            cost = sheetFraction * mat.price * item.quantity_required;
        } else {
            // Standard Unit Cost
            cost = mat.price * item.quantity_required;
        }
        
        return acc + cost;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateMaterialCost() + parseFloat(formData.labor_cost || 0);
  };

  const addMaterialToRecipe = () => {
      if (!currentMat.id || currentMat.quantity <= 0) return;
      
      const matDetails = materials.find(m => m.id === currentMat.id);
      if (!matDetails) return;

      setFormData({
          ...formData,
          materials: [
              ...formData.materials, 
              { 
                  material_id: currentMat.id, 
                  quantity_required: parseFloat(currentMat.quantity), 
                  name: matDetails.name, 
                  unit: matDetails.unit, 
                  price: matDetails.price,
                  cut_length: parseFloat(currentMat.cut_length || 0),
                  cut_width: parseFloat(currentMat.cut_width || 0),
                  type: matDetails.type
              }
          ]
      });
      setCurrentMat({ id: '', quantity: 0, cut_length: 0, cut_width: 0 });
  };

  const removeMaterialFromRecipe = (index) => {
      const newMats = [...formData.materials];
      newMats.splice(index, 1);
      setFormData({ ...formData, materials: newMats });
  };

  const handleSave = async () => {
    if (!formData.name || formData.materials.length === 0) {
      addToast('Please fill in name and add at least one material.', 'error');
      return;
    }

    setLoading(true);
    const payload = {
      name: formData.name,
      description: 'Custom Built Item',
      category: formData.category,
      base_price: calculateTotal(),
      labor_cost: formData.labor_cost,
      materials: formData.materials
    };

    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        addToast('Product Saved!', 'success');
        fetchProducts();
        setFormData({ name: '', category: 'Kitchen', labor_cost: 0, materials: [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <TitleSection>
          <h1>Products & Custom Elements</h1>
          <p>Manage your catalog and build custom furniture recipes.</p>
        </TitleSection>
        <Actions>
          <SearchBar>
            <Search size={18} color="#666" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>
          <CategoryFilter value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </CategoryFilter>
          <Button $primary onClick={() => setShowCategoryModal(true)}>
            <Settings size={18} /> Manage Categories
          </Button>
        </Actions>
      </Header>

      <MainGrid>
        {/* Left Panel: Product List */}
        <Panel>
          <PanelHeader>
            <h3><Package size={20} /> Product Catalog</h3>
          </PanelHeader>
          <ProductList>
            {products
              .filter(prod => 
                prod.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
                (filterCategory === 'All' || prod.category === filterCategory)
              )
              .map(prod => (
              <ProductItem key={prod.id} onClick={() => handleEditClick(prod)} style={{ cursor: 'pointer' }}>
                <div className="info">
                  <h4>{prod.name}</h4>
                  <span>{prod.category} • Labor: ${prod.labor_cost}</span>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Click to edit details</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="price">${prod.base_price}</div>
                  <Trash2 size={16} color="#666" style={{ cursor: 'pointer', zIndex: 10 }} onClick={(e) => handleDelete(prod.id, e)} />
                </div>
              </ProductItem>
            ))}
            {products.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No products found.</div>}
          </ProductList>
        </Panel>

        {/* Right Panel: Builder */}
        <Panel>
          <PanelHeader>
            <h3><Calculator size={20} /> Product Builder</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
                <Button style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)' }} onClick={() => setFormData({ name: '', category: categories.length > 0 ? categories[0].name : '', labor_cost: 0, materials: [] })}>
                     <Plus size={14} /> New
                </Button>
                <Button style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleSave} disabled={loading}>
                <Save size={14} /> {loading ? 'Saving...' : 'Save to Catalog'}
                </Button>
            </div>
          </PanelHeader>
          <BuilderContent>
            <InputGroup>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Field>
                  <label>Product Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Custom Wardrobe"
                  />
                </Field>
                <Field>
                  <label>Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.length === 0 && <option value="">Loading...</option>}
                    {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
              
              <VisualPreview>
                <Box size={64} />
                <span>Product Preview</span>
              </VisualPreview>
            </InputGroup>

            <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
              <h4 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={16} /> Material Recipe
              </h4>
              
              {/* Recipe List */}
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {formData.materials.map((item, idx) => {
                    let cost = 0;
                    if (item.type === 'Sheet' && item.cut_length > 0 && item.cut_width > 0) {
                        // Estimate cost based on area ratio for preview
                        // We need original sheet dims, assuming we have price/sheet
                        // Simple estimation: (Area / Standard Sheet Area) * Price * Qty
                        // However, strictly speaking, we might not have `mat.length` here easily without lookup.
                        // But we saved `price` which is Price Per Sheet.
                        // For display purposes, let's recalculate accurately just like calculateMaterialCost
                         const mat = materials.find(m => m.id === item.material_id);
                         if (mat && mat.length > 0 && mat.width > 0) {
                            const partArea = item.cut_length * item.cut_width;
                            const sheetArea = mat.length * mat.width;
                            cost = (partArea / sheetArea) * mat.price * item.quantity_required;
                         } else {
                            cost = item.price * item.quantity_required; // Fallback
                         }
                    } else {
                        cost = item.price * item.quantity_required;
                    }

                    return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)', padding: '10px', borderRadius: '8px' }}>
                        <div>
                            <div style={{ color: 'var(--white)', fontSize: '0.9rem' }}>{item.name}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                {item.quantity_required} {item.unit} 
                                {item.cut_length > 0 ? ` (${item.cut_length}x${item.cut_width}cm)` : ''}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                             <span style={{ color: '#27ae60', fontWeight: 'bold' }}>${cost.toFixed(2)}</span>
                             <Trash2 size={16} color="#e74c3c" style={{ cursor: 'pointer' }} onClick={() => removeMaterialFromRecipe(idx)} />
                        </div>
                    </div>
                    );
                })}
                {formData.materials.length === 0 && <div style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>No materials added yet.</div>}
              </div>

              {/* Add Material Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <Field>
                    <label>Material</label>
                    <select 
                        value={currentMat.id}
                        onChange={e => setCurrentMat({...currentMat, id: e.target.value, cut_length: 0, cut_width: 0})}
                    >
                        <option value="">Select Material...</option>
                        {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} (${m.price}/{m.unit})</option>
                        ))}
                    </select>
                    </Field>
                    <Field>
                    <label>Qty (Pieces)</label>
                    <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={currentMat.quantity}
                        onChange={e => setCurrentMat({...currentMat, quantity: e.target.value})}
                    />
                    </Field>
                 </div>
                 
                 {/* Dimensional Inputs for Sheet Materials */}
                 {(() => {
                     const selectedMat = materials.find(m => m.id === currentMat.id);
                     if (selectedMat && selectedMat.type === 'Sheet') {
                         return (
                            <div style={{ display: 'flex', gap: '10px', background: 'rgba(230, 126, 34, 0.1)', padding: '10px', borderRadius: '8px', border: '1px dashed #E67E22' }}>
                                <Field style={{flex: 1}}>
                                    <label style={{color: '#E67E22', fontSize: '0.8rem'}}>Length (cm)</label>
                                    <input 
                                        type="number" 
                                        placeholder="e.g. 180"
                                        value={currentMat.cut_length || ''}
                                        onChange={e => setCurrentMat({...currentMat, cut_length: e.target.value})}
                                    />
                                </Field>
                                <Field style={{flex: 1}}>
                                    <label style={{color: '#E67E22', fontSize: '0.8rem'}}>Width (cm)</label>
                                    <input 
                                        type="number" 
                                        placeholder="e.g. 40"
                                        value={currentMat.cut_width || ''}
                                        onChange={e => setCurrentMat({...currentMat, cut_width: e.target.value})}
                                    />
                                </Field>
                            </div>
                         )
                     }
                     return null;
                 })()}

                 <Button onClick={addMaterialToRecipe} style={{ width: '100%', justifyContent: 'center' }}><Plus size={18} /> Add to Recipe</Button>
              </div>
            </div>

            <CostSummary>
              <div className="row">
                <span>Material Cost</span>
                <span>${calculateMaterialCost().toFixed(2)}</span>
              </div>
              <div className="row">
                <span>Labor Cost</span>
                <div style={{ width: '100px' }}>
                  <input 
                    type="number" 
                    value={formData.labor_cost}
                    onChange={e => setFormData({...formData, labor_cost: parseFloat(e.target.value)})}
                    style={{ width: '100%', padding: '5px', background: '#333', border: 'none', color: 'white', textAlign: 'right' }}
                  />
                </div>
              </div>
              <div className="row total">
                <span>Total Base Price</span>
                <span style={{ color: '#E67E22' }}>${calculateTotal().toFixed(2)}</span>
              </div>
            </CostSummary>

          </BuilderContent>
        </Panel>
      </MainGrid>

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <Overlay onClick={() => setShowCategoryModal(false)}>
            <Modal onClick={e => e.stopPropagation()} style={{ width: '500px', maxHeight: '80vh' }}>
                <div className="header">
                    <h2><Settings size={20} /> Manage Categories</h2>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowCategoryModal(false)} />
                </div>
                <div className="body" style={{ display: 'flex', flexDirection: 'column', gridTemplateColumns: 'none' }}>
                    {/* Add New */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="New Category Name"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            style={{ 
                                flex: 1, padding: '10px', borderRadius: '8px', 
                                border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)' 
                            }}
                        />
                        <Button $primary onClick={handleAddCategory}><Plus size={18}/> Add</Button>
                    </div>

                    {/* List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '400px' }}>
                        {categories.map(cat => (
                            <div key={cat.id} style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' 
                            }}>
                                {editingCatId === cat.id ? (
                                    <input 
                                        type="text" 
                                        value={editCatName}
                                        autoFocus
                                        onChange={e => setEditCatName(e.target.value)}
                                        style={{ 
                                            flex: 1, padding: '8px', borderRadius: '4px', marginRight: '10px',
                                            border: '1px solid var(--primary)', background: 'var(--input-bg)', color: 'var(--text)' 
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontWeight: '500' }}>{cat.name}</span>
                                )}
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {editingCatId === cat.id ? (
                                        <>
                                            <Button style={{ padding: '6px' }} $primary onClick={() => handleUpdateCategory(cat.id)}><Save size={14}/></Button>
                                            <Button style={{ padding: '6px' }} onClick={() => setEditingCatId(null)}><X size={14}/></Button>
                                        </>
                                    ) : (
                                        <>
                                            <Edit size={16} color="var(--primary)" style={{ cursor: 'pointer' }} onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }} />
                                            <Trash2 size={16} color="#e74c3c" style={{ cursor: 'pointer' }} onClick={() => handleDeleteCategory(cat.id)} />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                </div>
            </Modal>
        </Overlay>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <Overlay onClick={() => setShowEditModal(false)}>
            <Modal onClick={e => e.stopPropagation()}>
                <div className="header">
                    <h2><Edit size={20} /> Edit Product: {editingProduct.name}</h2>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowEditModal(false)} />
                </div>
                <div className="body">
                    {/* Left Col: Basic Info & Recipe List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <Field>
                            <label>Product Name</label>
                            <input 
                                value={editingProduct.name} 
                                onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                            />
                        </Field>
                        <Field>
                            <label>Category</label>
                            <select 
                                value={editingProduct.category}
                                onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                            >
                                {categories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </Field>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Recipe Ingredients</h4>
                            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                                {editingProduct.materials.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {item.quantity_required} x ${Number(item.price).toFixed(2)} 
                                                {item.type === 'Sheet' && item.cut_length > 0 ? ` (${item.cut_length}x${item.cut_width}cm)` : ''}
                                            </div>
                                        </div>
                                        <Trash2 
                                            size={16} color="#ff5555" style={{ cursor: 'pointer' }} 
                                            onClick={() => {
                                                const newMats = [...editingProduct.materials];
                                                newMats.splice(idx, 1);
                                                setEditingProduct({...editingProduct, materials: newMats});
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Add Material & Cost */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         <h4 style={{ margin: 0, fontSize: '1rem' }}>Add New Ingredient</h4>
                         <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                             <Field>
                                <label>Material</label>
                                <select 
                                    value={editMat.id}
                                    onChange={e => setEditMat({...editMat, id: e.target.value})}
                                >
                                    <option value="">Select...</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                             </Field>
                             <Field>
                                <label>Qty</label>
                                <input 
                                    type="number" value={editMat.quantity}
                                    placeholder="#"
                                    onChange={e => setEditMat({...editMat, quantity: e.target.value})}
                                />
                             </Field>
                         </div>
                         {/* Dimensions for Edit Mode */}
                         {(() => {
                             const sel = materials.find(m => m.id == editMat.id); // Loose equality for string/number match
                             if (sel && sel.type === 'Sheet') {
                                 return (
                                    <div style={{ display: 'flex', gap: '10px', background: 'rgba(230, 126, 34, 0.1)', padding: '10px', borderRadius: '8px', border: '1px dashed #E67E22' }}>
                                        <input type="number" placeholder="L (cm)" value={editMat.cut_length || ''} onChange={e => setEditMat({...editMat, cut_length: e.target.value})} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E67E22'}} />
                                        <input type="number" placeholder="W (cm)" value={editMat.cut_width || ''} onChange={e => setEditMat({...editMat, cut_width: e.target.value})} style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E67E22'}} />
                                    </div>
                                 )
                             }
                         })()}
                         
                         <Button onClick={addMatToEdit} style={{ justifyContent: 'center' }}><Plus size={16}/> Add Ingredient</Button>

                         <div style={{ marginTop: 'auto', background: 'var(--bg-secondary)', padding: '15px', borderRadius: '12px' }}>
                             <Field>
                                 <label>Update Labor Cost ($)</label>
                                 <input 
                                    type="number" 
                                    value={editingProduct.labor_cost}
                                    onChange={e => setEditingProduct({...editingProduct, labor_cost: e.target.value})}
                                    style={{ textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }}
                                 />
                             </Field>
                         </div>
                    </div>
                </div>
                <div className="footer">
                    <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button $primary onClick={handleUpdateProduct}><Save size={18}/> Save Changes</Button>
                </div>
            </Modal>
        </Overlay>
      )}
    </Container>
  );
};

export default Products;
