import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Save, Upload, Sun, Moon, Info, Layout, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useConfirmation } from '../context/ConfirmationProvider';
import { API_URL } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg);
  padding: 15px 25px;
  border-radius: 12px;
  border: 1px solid var(--border);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    /* Make button full width if needed */
    button {
       width: 100%;
       justify-content: center;
    }
  }

  h2 {
    font-size: 1.5rem;
    color: var(--white);
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const Button = styled.button`
  background-color: ${props => props.$primary ? 'var(--secondary)' : 'var(--input-bg)'};
  color: ${props => props.$primary ? 'white' : 'var(--text)'};
  border: ${props => props.$primary ? 'none' : '1px solid var(--border)'};
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background-color: ${props => props.$primary ? '#D35400' : 'var(--border)'};
    color: var(--white);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 100%;
  
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 20px;

  h3 {
    font-size: 1.1rem;
    color: var(--white);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border);
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  grid-column: ${props => props.$full ? '1 / -1' : 'auto'};

  label {
    color: var(--text);
    opacity: 0.7;
    font-size: 0.85rem;
    font-weight: 600;
  }

  input, select, textarea {
    background-color: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 12px;
    border-radius: 8px;
    outline: none;
    font-family: inherit;
    
    &:focus { border-color: var(--secondary); }
  }
`;

const LogoPreview = styled.div`
  width: 120px;
  height: 120px;
  background-color: var(--input-bg);
  border: 2px dashed var(--border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  &:hover { border-color: var(--secondary); }
`;

const ThemeToggle = styled.div`
  display: flex;
  gap: 10px;
  background: var(--input-bg);
  padding: 4px;
  border-radius: 8px;
  width: fit-content;

  button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.2s;

    &.active {
      background-color: var(--secondary);
      color: white;
    }

    &.inactive {
      background-color: transparent;
      color: var(--text);
      &:hover { color: var(--white); }
    }
  }
`;


/**
 * Settings Page
 * Global System Configuration.
 * Sections:
 * - Appearance (Logo, Dark Mode)
 * - Shop Info (Name, Address - used in PDF Invoices)
 * - User Management (Create/Delete users)
 * - Material Types (Configure categories like 'Sheet', 'Liquid')
 */
const Settings = ({ onThemeChange }) => {
  const { addToast } = useToast();
  const { requestConfirmation } = useConfirmation();
  const [settings, setSettings] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
    tax_rate: 0,
    currency: 'DZD',
    logo: '',
    theme: 'dark'
  });
  const [loading, setLoading] = useState(true);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [newType, setNewType] = useState({ name: '', unit: '' });

  useEffect(() => {
    fetchSettings();
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/types`);
      const data = await response.json();
      setMaterialTypes(data);
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newType.name || !newType.unit) return;
    try {
      const response = await fetch(`${API_URL}/api/settings/types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType)
      });
      if (response.ok) {
        setNewType({ name: '', unit: '' });
        fetchTypes();
        addToast("Material Type Added", "success");
      }
    } catch (error) {
      console.error('Error adding type:', error);
      addToast("Failed to add type", "error");
    }
  };

  const handleDeleteType = (id) => {
    requestConfirmation({
      title: 'Delete Material Type',
      message: 'Are you sure? This might affect existing materials.',
      onConfirm: async () => {
        try {
          await fetch(`${API_URL}/api/settings/types/${id}`, { method: 'DELETE' });
          fetchTypes();
          addToast("Type deleted", "success");
        } catch (error) {
          console.error('Error deleting type:', error);
          addToast("Error deleting type", "error");
        }
      }
    });
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`);
      const data = await response.json();
      setSettings({
        ...data,
        theme: data.theme || 'dark', // Default to dark if missing
        logo: data.logo || '' // Default to empty if missing
      });
      // Sync App theme with fetched settings (in case Settings is visited directly or refreshed)
      if (onThemeChange && data.theme) {
        onThemeChange(data.theme);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Theme Handler
   * Toggles Light/Dark mode.
   * Persists preference to database so it loads on next login.
   */
  const handleThemeChange = async (newTheme) => {
    const updatedSettings = { ...settings, theme: newTheme };
    setSettings(updatedSettings);
    
    // Visually update immediately
    if (onThemeChange) {
      onThemeChange(newTheme);
    }

    // Auto-save the theme preference
    try {
      await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      // Optional: addToast('Theme updated', 'success');
  /**
   * Save Global Settings
   * Updates Shop Name, Logo, Tax Rate etc.
   */
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        addToast('Settings saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      addToast("Error saving settings", "error");
    }
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <h2>Settings</h2>
        <Button $primary onClick={handleSave}><Save size={18} /> Save Changes</Button>
      </Header>

      <Grid>
        <Card>
          <h3><Layout size={20} /> Appearance & Branding</h3>
          <FormRow>
            <Field>
              <label>Logo</label>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <LogoPreview onClick={() => document.getElementById('logo-upload').click()}>
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" />
                  ) : (
                    <Upload size={24} color="#666" />
                  )}
                </LogoPreview>
                <input 
                  id="logo-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoChange}
                  style={{ display: 'none' }} 
                />
                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                  Recommended size:<br/>200x200px (PNG)
                </div>
              </div>
            </Field>

            <Field>
              <label>Theme Mode</label>
              <ThemeToggle>
                <button 
                  className={settings.theme === 'light' ? 'active' : 'inactive'}
                  onClick={() => handleThemeChange('light')}
                >
                  <Sun size={16} /> Light
                </button>
                <button 
                  className={settings.theme === 'dark' ? 'active' : 'inactive'}
                  onClick={() => handleThemeChange('dark')}
                >
                  <Moon size={16} /> Dark
                </button>
              </ThemeToggle>
              {/* Info text removed as theme change is now instant */}
            </Field>
          </FormRow>
        </Card>

        <Card>
          <h3>Shop Configuration</h3>
          <FormRow>
            <Field>
              <label>Shop Name</label>
              <input 
                type="text" 
                name="shop_name" 
                value={settings.shop_name} 
                onChange={handleChange} 
                placeholder="e.g. My Woodshop"
              />
            </Field>

            <Field>
              <label>Phone Number</label>
              <input 
                type="text" 
                name="shop_phone" 
                value={settings.shop_phone} 
                onChange={handleChange} 
              />
            </Field>
          </FormRow>

          <Field $full>
            <label>Shop Address</label>
            <input 
              type="text" 
              name="shop_address" 
              value={settings.shop_address} 
              onChange={handleChange}
              placeholder="Full address for invocies" 
            />
          </Field>
        </Card>

        <Card style={{ gridColumn: '1 / -1' }}>
          <h3>Material Definitions</h3>
          <div style={{display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px'}}>
            <Field style={{flex: 1}}>
              <label>Type Name</label>
              <input 
                placeholder="e.g. Screws" 
                value={newType.name}
                onChange={e => setNewType({...newType, name: e.target.value})}
              />
            </Field>
            <Field style={{flex: 1}}>
              <label>Measuring Unit</label>
              <input 
                placeholder="e.g. Box (100pcs)" 
                value={newType.unit}
                onChange={e => setNewType({...newType, unit: e.target.value})}
              />
            </Field>
            <Button onClick={handleAddType}><Plus size={18} /> Add</Button>
          </div>

          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--border)', textAlign: 'left'}}>
                <th style={{padding: '10px', color: 'var(--text)'}}>Name</th>
                <th style={{padding: '10px', color: 'var(--text)'}}>Default Unit</th>
                <th style={{padding: '10px', color: 'var(--text)'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {materialTypes.map(type => (
                <tr key={type.id} style={{borderBottom: '1px solid var(--border)'}}>
                  <td style={{padding: '12px', color: 'var(--white)'}}>{type.name}</td>
                  <td style={{padding: '12px', color: 'var(--text)'}}>{type.unit}</td>
                  <td style={{padding: '12px'}}>
                    <Trash2 
                      size={18} 
                      color="#e74c3c" 
                      style={{cursor: 'pointer'}} 
                      onClick={() => handleDeleteType(type.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Grid>
    </Container>
  );
};

export default Settings;
