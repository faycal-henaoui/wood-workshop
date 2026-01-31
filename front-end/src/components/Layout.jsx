import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Settings, FileText, Boxes, BarChart2, ShieldCheck, Menu, ShoppingCart, LogOut, X } from 'lucide-react';
import defaultLogo from '../logo-removebg-preview.svg';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const Navbar = styled.div`
  height: 70px;
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;
  z-index: 20;

  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  img {
    height: 40px;
    width: auto;
  }

  h2 {
    color: var(--white);
    font-size: 1.4rem;
    margin: 0;
    font-weight: 800;
    letter-spacing: -0.5px;
    
    span {
      color: var(--secondary);
    }
  }

  @media (max-width: 768px) {
    h2 { font-size: 1.2rem; }
    img { height: 32px; }
  }
`;

const TopNavLinks = styled.div`
  display: flex;
  gap: 20px;

  @media (max-width: 900px) {
    display: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: var(--white);
  cursor: pointer;
  padding: 5px;

  @media (max-width: 900px) {
    display: flex;
  }
`;

const TopNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.$active ? 'var(--secondary)' : 'var(--text)'};
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: ${props => props.$active ? 'rgba(230, 126, 34, 0.1)' : 'transparent'};
  transition: all 0.2s;

  &:hover {
    color: var(--secondary);
    background-color: rgba(230, 126, 34, 0.05);
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background-color: var(--background);
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const RightSidebarContainer = styled.div`
  position: fixed;
  right: 0;
  top: 70px; /* Below Navbar */
  bottom: 0;
  width: 260px;
  z-index: 100;
  display: flex;
  transform: translateX(calc(100% - 10px)); /* Keep 10px visible as trigger */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* Desktop Hover Effect */
  @media (min-width: 901px) {
    &:hover {
      transform: translateX(0);
    }
  }

  /* Mobile/Tablet: Controlled by state */
  @media (max-width: 900px) {
    transform: translateX(${props => props.$isOpen ? '0' : '100%'});
    width: 280px;
    box-shadow: -10px 0 30px rgba(0,0,0,0.5);
    /* Remove the 10px visible trigger on mobile as it interferes with scrolling */
    right: ${props => props.$isOpen ? '0' : '-280px'}; 
  }
`;

const SidebarTrigger = styled.div`
  width: 10px;
  height: 100%;
  background: var(--card-bg); /* Visible trigger zone */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid var(--border);
  
  /* Visual indicator for the edge */
  &::before {
    content: '';
    width: 4px;
    height: 40px;
    background-color: var(--border);
    border-radius: 2px;
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const SidebarContent = styled.div`
  width: 250px;
  background-color: var(--card-bg);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-shadow: -5px 0 15px rgba(0,0,0,0.3);
  height: 100%;
  overflow-y: auto;
  
  @media (max-width: 900px) {
    width: 100%;
    border-left: none;
  }
`;

/* Overlay for mobile */
const MobileOverlay = styled.div`
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 90;
  display: none;
  backdrop-filter: blur(2px);
  
  @media (max-width: 900px) {
    display: ${props => props.$isOpen ? 'block' : 'none'};
  }
`;

const SidebarHeader = styled.h3`
  color: var(--text);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: ${props => props.$active ? 'var(--secondary)' : 'var(--text)'};
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
  background-color: ${props => props.$active ? 'rgba(230, 126, 34, 0.1)' : 'transparent'};
  border-left: 3px solid ${props => props.$active ? 'var(--secondary)' : 'transparent'};

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--white);
    transform: translateX(5px);
  }

  svg {
    margin-right: 12px;
    color: ${props => props.$active ? 'var(--secondary)' : 'var(--text)'};
  }
`;

/**
 * Main App Layout
 * Wraps every page with the Navigation Bar and Sidebar.
 * Handles responsive behavior (Mobile Menu toggling).
 * Displays branding and navigation links.
 */
const Layout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [shopSettings, setShopSettings] = useState({ name: 'Workshop', logo: defaultLogo });
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        setShopSettings({
          name: data.shop_name || 'Workshop',
          logo: data.logo || defaultLogo
        });
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <Container>
      <Navbar>
        <LogoSection>
          <img src={shopSettings.logo} alt="Logo" />
          <h2>{shopSettings.name} <span>Craft</span></h2>
        </LogoSection>
        
        <TopNavLinks>
          <TopNavLink to="/" $active={isActive('/')}>
            <LayoutDashboard size={18} /> Dashboard
          </TopNavLink>
          <TopNavLink to="/invoices/new" $active={isActive('/invoices/new')}>
            <FileText size={18} /> New Invoice
          </TopNavLink>
          <TopNavLink to="/orders" $active={isActive('/orders')}>
            <FileText size={18} /> Orders
          </TopNavLink>
          <TopNavLink to="/stock" $active={isActive('/stock')}>
            <Package size={18} /> Stock
          </TopNavLink>
          <TopNavLink to="/purchases" $active={isActive('/purchases')}>
            <ShoppingCart size={18} /> Purchases
          </TopNavLink>
          <TopNavLink as="button" onClick={logout} style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #c0392b', color: '#ffaaaa', cursor: 'pointer' }}>
            <LogOut size={18} /> Logout
          </TopNavLink>
        </TopNavLinks>

        <MobileMenuButton onClick={() => setSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </MobileMenuButton>
      </Navbar>

      <ContentWrapper>
        <MainContent>
          {children}
        </MainContent>

        <MobileOverlay $isOpen={isSidebarOpen} onClick={() => setSidebarOpen(false)} />

        <RightSidebarContainer $isOpen={isSidebarOpen}>
          <SidebarTrigger title="Expand Menu" />
          <SidebarContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <SidebarHeader>Menu</SidebarHeader>
            </div>
            
            <NavItem to="/" $active={isActive('/')}>
              <LayoutDashboard size={20} /> Dashboard
            </NavItem>
            {/* Added Logout for Mobile inside Sidebar since TopNav is hidden */}
            <NavItem 
                as="button" 
                className="mobile-only"
                onClick={logout} 
                style={{ 
                    marginTop: 'auto', 
                    color: '#ff6b6b', 
                    borderTop: '1px solid var(--border)',
                    paddingTop: '15px' 
                }}
            >
              <LogOut size={20} /> Logout
            </NavItem>

            <NavItem to="/orders" $active={isActive('/orders')}>
              <FileText size={20} /> Orders & Invoices
            </NavItem>
            <NavItem to="/invoices/new" $active={isActive('/invoices/new')}>
              <FileText size={20} /> New Invoice
            </NavItem>
            <NavItem to="/products" $active={isActive('/products')}>
              <Boxes size={20} /> Products & Elements
            </NavItem>
            <NavItem to="/reports" $active={isActive('/reports')}>
              <BarChart2 size={20} /> Reports
            </NavItem>
            <NavItem to="/stock" $active={isActive('/stock')}>
              <Package size={20} /> Stock & Materials
            </NavItem>
            <NavItem to="/purchases" $active={isActive('/purchases')}>
              <ShoppingCart size={20} /> Purchases
            </NavItem>
            <NavItem to="/clients" $active={isActive('/clients')}>
              <Users size={20} /> Clients
            </NavItem>
            <NavItem to="/settings" $active={isActive('/settings')}>
              <Settings size={20} /> Settings
            </NavItem>
          </SidebarContent>
        </RightSidebarContainer>
      </ContentWrapper>
    </Container>
  );
};

export default Layout;
