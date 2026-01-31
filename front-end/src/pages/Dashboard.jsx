import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AlertTriangle, TrendingUp, Package, DollarSign, ShoppingCart, Hammer, X as CloseIcon, Clock, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { API_URL } from '../config';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;

  /* Force icon to follow theme text or specific color */
  svg {
    color: var(--secondary);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  background-color: ${props => props.$variant === 'wood' ? 'var(--secondary)' : 'var(--card-bg)'};
  color: ${props => props.$variant === 'wood' ? 'white' : 'var(--white)'};
  padding: 24px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 140px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
  transition: transform 0.2s;
  border: 1px solid var(--border);

  &:hover {
    transform: ${props => props.onClick ? 'translateY(-4px)' : 'none'};
  }

  h3 {
    color: ${props => props.$variant === 'wood' ? 'rgba(255,255,255,0.9)' : 'var(--text)'};
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 8px;
    opacity: 0.8;
  }

  .value {
    font-size: 2rem;
    font-weight: bold;
    color: ${props => props.$variant === 'wood' ? 'white' : 'var(--white)'};
  }

  .icon {
    position: absolute;
    bottom: 20px;
    right: 20px;
    opacity: 0.1;
    color: ${props => props.$variant === 'wood' ? 'white' : 'var(--text)'};
  }
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid var(--border);
  overflow-x: auto; /* Ensure cards with charts/tables don't break layout */
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 16px;
  color: var(--white);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AlertItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: ${props => props.$critical ? 'rgba(211, 47, 47, 0.1)' : 'rgba(255, 160, 0, 0.1)'};
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid ${props => props.$critical ? '#d32f2f' : '#ffa000'};

  span.label {
    font-weight: 600;
    color: var(--white);
  }
  
  span.status {
    color: ${props => props.$critical ? '#d32f2f' : '#f57c00'};
    font-weight: bold;
    font-size: 0.9rem;
  }
`;

const SmallCardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
`;

const SmallStatCard = styled.div`
  background-color: var(--input-bg);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary);
  }

  .icon-box {
    background-color: ${props => props.$color ? `${props.$color}20` : 'rgba(255,255,255,0.1)'};
    padding: 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$color || 'var(--text)'};
  }

  .content {
    display: flex;
    flex-direction: column;
    
    h4 {
      margin: 0 0 4px 0;
      font-size: 0.8rem;
      color: var(--text-secondary);
      font-weight: 500;
      text-transform: uppercase;
    }
    
    span {
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--text);
    }
  }
`;

const ActivityList = styled.ul`
  list-style: none;
  padding: 0; 
  
  li {
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text);

    &:last-child {
      border-bottom: none;
    }

    /* Wrap text on small screens */
    flex-wrap: wrap; 

    svg {
      color: var(--secondary);
      flex-shrink: 0;
    }
  }
`;

const InvoiceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 500px; /* Force scroll on really small screens */
  
  th, td {
    text-align: left;
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }

  th {
    color: var(--text);
    font-weight: 500;
    font-size: 0.9rem;
    opacity: 0.7;
  }

  td {
    font-weight: 500;
    color: var(--white);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ActionBtn = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1rem;
  transition: transform 0.1s;

  &:hover {
    transform: translateY(-2px);
  }

  &.green {
    background-color: #558B2F;
    color: white;
  }

  &.brown {
    background-color: var(--secondary);
    color: white;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: var(--card-bg);
  padding: 30px;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;

  h2 { color: var(--white); margin: 0; }
  
  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: transparent;
    border: none;
    color: var(--text);
    cursor: pointer;
    &:hover { color: var(--white); }
  }
`;

const ChartContainer = styled.div`
  background: var(--input-bg);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  height: 300px;
  
  h3 { color: var(--text); margin-bottom: 15px; font-size: 1rem; }
`;

/**
 * Dashboard Page
 * Displays high-level business metrics including:
 * - Total Stock Value
 * - Monthly Revenue
 * - Active Projects
 * - Recent Invoices table
 * - Financial breakdown charts
 */
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStockValue: 0,
    lowStockItems: [],
    ordersThisMonth: 0,
    revenueThisMonth: 0,
    recentInvoices: [],
    ordersToday: 0,
    mostUsedMaterial: null,
    activeProjects: 0,
    pendingPayments: 0
  });
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueData, setRevenueData] = useState([]);

  /**
   * Fetch Dashboard Statistics
   * Loads aggregated data from the '/api/dashboard' endpoint.
   * Updates state with stock value, revenue, etc.
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dashboard`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  /**
   * Revenue Breakdown
   * Fetches detailed revenue data when clicking the revenue card.
   * Updates state for the breakdown modal showing monthly trends.
   */
  const handleRevenueClick = async () => {
    setShowRevenueModal(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboard/breakdown`);
      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue breakdown:', error);
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <Hammer size={32} color="var(--primary)" />
        <h1>THE WOODWORKER'S BENCH</h1>
      </Header>

      {/* Top Stats Row */}
      <StatsGrid>
        <StatCard>
          <h3>Total Stock Value</h3>
          <div className="value">${Number(stats.totalStockValue).toLocaleString()}</div>
          <Package className="icon" size={48} />
        </StatCard>
        
        <StatCard $variant="wood">
          <h3>Low Stock Materials</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={24} color="#FFD700" />
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              {stats.lowStockItems.length > 0 
                ? `${stats.lowStockItems.length} items low` 
                : 'Stock levels OK'}
            </span>
          </div>
        </StatCard>

        <StatCard>
          <h3>Orders This Month</h3>
          <div className="value">{stats.ordersThisMonth}</div>
          <ShoppingCart className="icon" size={48} />
        </StatCard>

        <StatCard onClick={handleRevenueClick}>
          <h3>Revenue This Month</h3>
          <div className="value">${Number(stats.revenueThisMonth).toLocaleString()}</div>
          <DollarSign className="icon" size={48} />
        </StatCard>
      </StatsGrid>

      {/* Middle Section */}
      <SectionGrid>
        <Card>
          <SectionTitle>Stock Alerts</SectionTitle>
          {stats.lowStockItems.length === 0 ? (
            <p>All stock levels are good.</p>
          ) : (
            stats.lowStockItems.map((item, index) => (
              <AlertItem key={index} $critical={item.quantity === 0}>
                <span className="label">{item.name}</span>
                <span className="status">
                  {item.quantity === 0 ? 'OUT OF STOCK' : `${item.quantity} ${item.unit} left`}
                </span>
              </AlertItem>
            ))
          )}
        </Card>

        <Card>
          <SectionTitle>Activity & Status</SectionTitle>
          
          <SmallCardGrid>
            <SmallStatCard $color="#F39C12">
              <div className="icon-box">
                <Clock size={20} />
              </div>
              <div className="content">
                <h4>Active Projects</h4>
                <span>{stats.activeProjects}</span>
              </div>
            </SmallStatCard>
            
            <SmallStatCard $color="#E74C3C">
              <div className="icon-box">
                <Wallet size={20} />
              </div>
              <div className="content">
                <h4>Pending Payments</h4>
                <span>${Number(stats.pendingPayments).toLocaleString()}</span>
              </div>
            </SmallStatCard>
          </SmallCardGrid>

          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Daily Overview</h4>
          <ActivityList>
            <li>
              <ShoppingCart size={16} />
              Orders created today: <strong>{stats.ordersToday}</strong>
            </li>
            <li>
              <Package size={16} />
              Most used material: 
              <strong>
                {stats.mostUsedMaterial 
                  ? ` ${stats.mostUsedMaterial.name} (${Number(stats.mostUsedMaterial.total_used).toFixed(1)} ${stats.mostUsedMaterial.unit})` 
                  : ' -'}
              </strong>
            </li>
          </ActivityList>
        </Card>
      </SectionGrid>

      {/* Bottom Section */}
      <SectionGrid>
        <Card>
          <SectionTitle>Recent Invoices</SectionTitle>
          <div className="table-responsive">
            <InvoiceTable>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInvoices.map((invoice, index) => (
                  <tr key={index}>
                    <td>#{invoice.invoice_number}</td>
                    <td>{invoice.client_name}</td>
                    <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                    <td>${Number(invoice.total_amount).toLocaleString()}</td>
                  </tr>
                ))}
                {stats.recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>No recent invoices</td>
                  </tr>
                )}
              </tbody>
            </InvoiceTable>
          </div>
        </Card>

        <ActionButtons>
          <ActionBtn to="/invoices/new" className="green">
            Create New Order
          </ActionBtn>
          <ActionBtn to="/stock" className="brown">
            Update Stock
          </ActionBtn>
        </ActionButtons>
      </SectionGrid>

      {showRevenueModal && (
        <ModalOverlay onClick={() => setShowRevenueModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowRevenueModal(false)}>
              <CloseIcon size={24} />
            </button>
            <h2>Monthly Performance Breakdown</h2>
            
            <ChartContainer>
              <h3>Daily Revenue</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="day_label" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#E67E22" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer>
              <h3>Daily Orders</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="day_label" stroke="#888" />
                  <YAxis stroke="#888" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="orders" stroke="#3498DB" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ModalContent>
        </ModalOverlay>
      )}

    </DashboardContainer>
  );
};

export default Dashboard;
