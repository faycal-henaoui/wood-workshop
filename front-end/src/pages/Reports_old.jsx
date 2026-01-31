import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Calendar, ChevronDown, Filter, TrendingUp, AlertTriangle, User } from 'lucide-react';
import html2pdf from 'html2pdf.js';
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

  h2 {
    font-size: 1.5rem;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;

  .dropdown-wrapper {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background-color: var(--input-bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    z-index: 10;
    min-width: 150px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .dropdown-item {
    padding: 10px 15px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;

    &:hover {
      background-color: var(--bg-secondary);
      color: var(--text);
    }
    
    &.active {
      background-color: var(--primary);
      color: white;
    }
  }

  button {
    background-color: var(--input-bg);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 8px 16px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: 0.2s;

    &:hover {
      background-color: var(--bg-secondary);
      color: var(--text);
    }

    &.primary {
      background-color: var(--primary);
      border-color: var(--primary);
      color: white;
      
      &:hover { filter: brightness(1.1); }
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  flex: 1;
`;

const Card = styled.div`
  background-color: var(--card-bg);
  border-radius: 16px;
  padding: 25px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 300px;

  h3 {
    font-size: 1.1rem;
    color: var(--text);
    margin: 0;
  }
`;

// --- Chart Components (Simulated with CSS/SVG) ---

const BarChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 10px;

  .bar-row {
    display: flex;
    flex-direction: column;
    gap: 5px;

    .label {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .bar-bg {
      height: 8px;
      background-color: var(--bg-secondary);
      border-radius: 4px;
      overflow: hidden;

      .bar-fill {
        height: 100%;
        background-color: #4CAF50; // Green for materials
        border-radius: 4px;
      }
    }
  }
`;

const DonutChartContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  height: 100%;

  .donut {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    /* Use fixed colors for chart segments, or specific css properties if needed */
    background: conic-gradient(
      #4CAF50 0% 60%,   /* Profit */
      #E67E22 60% 85%,  /* Labor */
      #555 85% 100%     /* Materials/Overhead */
    );
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: '';
      position: absolute;
      width: 100px;
      height: 100px;
      background-color: var(--card-bg);
      border-radius: 50%;
    }

    .center-text {
      position: absolute;
      z-index: 1;
      text-align: center;
      
      span { display: block; }
      .val { font-size: 1.5rem; font-weight: bold; color: var(--text); }
      .lbl { font-size: 0.75rem; color: var(--text-secondary); }
    }
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: 10px;
    
    .item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--text-secondary);
      
      .dot { width: 10px; height: 10px; border-radius: 2px; }
    }
  }
`;

const LineChartSVG = styled.svg`
  width: 100%;
  height: 200px;
  overflow: visible;

  .grid-line { stroke: var(--border); stroke-width: 1; }
  .chart-line { 
    fill: none; 
    stroke: #4CAF50; 
    stroke-width: 3; 
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  text { fill: var(--text-secondary); font-size: 12px; }

  .tooltip-bg, .tooltip-text {
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }
  
  .chart-point:hover .tooltip-bg, 
  .chart-point:hover .tooltip-text {
    opacity: 1;
  }

  .chart-point circle {
    cursor: pointer;
    transition: r 0.2s;
  }

  .chart-point:hover circle {
    r: 6;
  }
`;

const SupplierTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin-top: 10px;

  th { text-align: left; color: var(--text-secondary); padding-bottom: 10px; font-weight: normal; }
  td { padding: 10px 0; border-top: 1px solid var(--border); color: var(--text); }
  
  .rating {
    background: var(--bg-secondary);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  position: relative;
  cursor: help;
  padding: 4px 0;

  .dot { width: 10px; height: 10px; border-radius: 2px; }

  .tooltip {
    visibility: hidden;
    width: 200px;
    background-color: var(--bg-secondary);
    color: var(--text);
    text-align: center;
    border-radius: 6px;
    padding: 8px 12px;
    position: absolute;
    z-index: 100;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    font-size: 0.75rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    border: 1px solid var(--border);
    pointer-events: none;
    margin-bottom: 8px;
    line-height: 1.4;

    &::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -6px;
      border-width: 6px;
      border-style: solid;
      border-color: var(--bg-secondary) transparent transparent transparent;
    }
  }

  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
    transform: translateX(-50%) translateY(-5px);
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85); /* Keep dark for focus */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 20000;
  color: white;
  backdrop-filter: blur(5px);

  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255,255,255,0.1);
    border-top: 5px solid #E67E22;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PrintContainer = styled.div`
  position: fixed;
  left: -10000px; /* Off-screen by default */
  top: 0;
  width: 297mm;
  min-height: 210mm;
  background: white;
  color: #111;
  padding: 40px;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
  z-index: 10000;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 3px solid #E67E22;
    padding-bottom: 20px;
    margin-bottom: 30px;

    h1 { margin: 0; font-size: 24px; color: #111; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .meta { text-align: right; }
    p { margin: 4px 0; color: #666; font-size: 12px; }
  }

  .summary-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 40px;

    .metric {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #eee;
      
      .label { font-size: 11px; text-transform: uppercase; color: #888; font-weight: 600; margin-bottom: 8px; }
      .value { font-size: 24px; font-weight: 700; color: #111; }
      .sub { font-size: 12px; color: #4CAF50; margin-top: 4px; }
    }
  }

  .chart-section {
    margin-bottom: 40px;
    page-break-inside: avoid;
    
    h3 { font-size: 16px; color: #333; margin-bottom: 20px; border-left: 4px solid #E67E22; padding-left: 10px; }
  }

  .split-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    
    th { text-align: left; padding: 12px; background: #f8f9fa; color: #555; font-weight: 600; border-bottom: 2px solid #eee; }
    td { padding: 12px; border-bottom: 1px solid #eee; color: #333; }
  }

  /* Light Mode Chart Overrides */
  .grid-line { stroke: #eee !important; }
  text { fill: #666 !important; }
  .bar-bg { background-color: #eee !important; }
`;

const Reports = () => {
  const [stats, setStats] = useState({ revenue: 0, profit: 0, margin: 0, cost: 0 });
  const [materials, setMaterials] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [clientSortBy, setClientSortBy] = useState('revenue');
  const [timeRange, setTimeRange] = useState(6);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, matRes, revRes] = await Promise.all([
          fetch(`${API_URL}/api/reports/stats?months=${timeRange}`),
          fetch(`${API_URL}/api/reports/materials`),
          fetch(`${API_URL}/api/reports/revenue?months=${timeRange}`)
        ]);

        const statsData = await statsRes.json();
        const matData = await matRes.json();
        const revData = await revRes.json();

        // Process revData to ensure correct months
        const filledRevenueData = [];
        for (let i = timeRange - 1; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            
            // Generate key YYYY-MM to match backend
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const key = `${year}-${month}`;
            
            // Display name (keep localized)
            const monthName = d.toLocaleString('default', { month: 'short' });
            
            const found = revData.find(r => r.month_key === key);
            filledRevenueData.push({
                month: monthName,
                revenue: found ? parseFloat(found.revenue) : 0
            });
        }

        setStats(statsData);
        setMaterials(matData);
        setRevenueData(filledRevenueData);
      } catch (error) {
        console.error('Error fetching report data:', error);
      }
    };

    fetchData();
  }, [timeRange]);

  useEffect(() => {
    fetch(`${API_URL}/api/reports/clients?sortBy=${clientSortBy}`)
      .then(res => res.json())
      .then(data => setTopClients(data))
      .catch(err => console.error('Error fetching clients:', err));
  }, [clientSortBy]);

  const handleExportPDF = () => {
    setIsExporting(true);
    
    // Wait for the overlay to appear
    setTimeout(() => {
      const element = document.getElementById('print-report-content');
      
      // Create a dedicated container for PDF generation
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'fixed';
      pdfContainer.style.top = '0';
      pdfContainer.style.left = '0';
      pdfContainer.style.zIndex = '10000'; // Below the loading overlay (20000)
      pdfContainer.style.background = 'white';
      
      // Clone the report content
      const clone = element.cloneNode(true);
      
      // Override styles on the clone to make it visible and positioned correctly
      clone.style.position = 'relative';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.display = 'block';
      
      pdfContainer.appendChild(clone);
      document.body.appendChild(pdfContainer);
      
      const opt = {
        margin: 0,
        filename: `Workshop_Craft_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          windowWidth: 1123
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      html2pdf().set(opt).from(clone).save().then(() => {
        document.body.removeChild(pdfContainer);
        setIsExporting(false);
      });
    }, 500);
  };

  // Calculate max value for charts
  const maxRevenue = Math.max(...revenueData.map(d => parseFloat(d.revenue)), 1000);
  const maxMaterial = Math.max(...materials.map(m => parseFloat(m.val)), 10);

  // Generate points for line chart
  const points = revenueData.map((d, i) => {
    const x = (i / (revenueData.length - 1 || 1)) * 400;
    const y = 150 - (parseFloat(d.revenue) / maxRevenue) * 140;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Container>
      {/* Dashboard is always visible to the user, no flickering */}
      <div style={{ display: 'block' }}>
      <Header>
        <h2><TrendingUp size={24} color="#E67E22" /> Reports & Analytics</h2>
        <Controls>
          <div className="dropdown-wrapper">
            <button onClick={() => setShowRangeDropdown(!showRangeDropdown)}>
              <Calendar size={16} /> Last {timeRange} Months <ChevronDown size={14} />
            </button>
            {showRangeDropdown && (
              <div className="dropdown-menu">
                {[1, 3, 6, 12].map(range => (
                  <div 
                    key={range} 
                    className={`dropdown-item ${timeRange === range ? 'active' : ''}`}
                    onClick={() => {
                      setTimeRange(range);
                      setShowRangeDropdown(false);
                    }}
                  >
                    Last {range} Month{range > 1 ? 's' : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="primary" onClick={handleExportPDF}>Export PDF</button>
        </Controls>
      </Header>

      <Grid id="report-content">
        {/* Card 1: Most Used Materials */}
        <Card>
          <h3>Most Used Materials ({new Date().toLocaleString('default', { month: 'long' })})</h3>
          <BarChart>
            {materials.length > 0 ? materials.map((item, i) => (
              <div className="bar-row" key={i}>
                <div className="label">
                  <span>{item.name}</span>
                  <span>{item.val} units</span>
                </div>
                <div className="bar-bg">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${(item.val / maxMaterial) * 100}%`, 
                      backgroundColor: '#4CAF50' 
                    }}
                  ></div>
                </div>
              </div>
            )) : <p style={{color: '#666'}}>No material usage data for this month.</p>}
          </BarChart>
        </Card>

        {/* Card 2: Profit Overview */}
        <Card>
          <h3>Profit Overview</h3>
          <DonutChartContainer>
            <div className="donut">
              <div className="center-text">
                <span className="lbl">Net Profit</span>
                <span className="val">${stats.profit.toLocaleString()}</span>
              </div>
            </div>
            <div className="legend">
              <LegendItem>
                <div className="dot" style={{ background: '#4CAF50' }}></div> 
                Margin: {stats.margin}%
                <div className="tooltip">Net Profit Margin = (Net Profit / Revenue) × 100</div>
              </LegendItem>
              <LegendItem>
                <div className="dot" style={{ background: '#E67E22' }}></div> 
                Revenue: ${stats.revenue.toLocaleString()}
                <div className="tooltip">Total income generated from all invoices in the selected period.</div>
              </LegendItem>
              <LegendItem>
                <div className="dot" style={{ background: '#555' }}></div> 
                Costs: ${stats.cost.toLocaleString()}
                <div className="tooltip">Total expenses including material costs and labor.</div>
              </LegendItem>
            </div>
          </DonutChartContainer>
        </Card>

        {/* Card 3: Monthly Revenue */}
        <Card>
          <h3>Monthly Revenue</h3>
          <div style={{ position: 'relative' }}>
            <h1 style={{ fontSize: '2.5rem', color: 'white', margin: '10px 0' }}>
              ${stats.revenue.toLocaleString()}
            </h1>
            <LineChartSVG viewBox="0 0 400 150">
              {/* Grid Lines */}
              <line x1="0" y1="150" x2="400" y2="150" className="grid-line" />
              <line x1="0" y1="100" x2="400" y2="100" className="grid-line" />
              <line x1="0" y1="50" x2="400" y2="50" className="grid-line" />
              
              {/* The Line Graph */}
              {points && <polyline points={points} className="chart-line" />}
              
              {/* Data Points */}
              {revenueData.map((d, i) => {
                const x = (i / (revenueData.length - 1 || 1)) * 400;
                const y = 150 - (parseFloat(d.revenue) / maxRevenue) * 140;
                const revenueText = `$${parseFloat(d.revenue).toLocaleString()}`;
                // Calculate approximate width for background based on text length (approx 7px per char)
                const bgWidth = revenueText.length * 8 + 10; 
                
                return (
                  <g key={i} className="chart-point">
                    <circle cx={x} cy={y} r="4" fill="#4CAF50" stroke="#1E1E1E" strokeWidth="2" />
                    
                    {/* Tooltip Background */}
                    <rect 
                      x={x - bgWidth / 2} 
                      y={y - 35} 
                      width={bgWidth} 
                      height="24" 
                      rx="4" 
                      fill="#2a2a2a" 
                      stroke="#444"
                      strokeWidth="1"
                      className="tooltip-bg" 
                    />
                    
                    {/* Tooltip Text */}
                    <text 
                      x={x} 
                      y={y - 19} 
                      textAnchor="middle" 
                      fill="#fff" 
                      fontSize="11" 
                      fontWeight="bold"
                      className="tooltip-text"
                    >
                      {revenueText}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Labels */}
              {revenueData.map((d, i) => (
                <text key={i} x={(i / (revenueData.length - 1 || 1)) * 380} y="170">{d.month}</text>
              ))}
            </LineChartSVG>
          </div>
        </Card>

        {/* Card 4: Top Clients */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Top Clients</h3>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#E67E22', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setClientSortBy(prev => prev === 'revenue' ? 'invoices' : 'revenue')}
              title="Click to toggle sort order"
            >
              <User size={14} /> {clientSortBy === 'revenue' ? 'By Revenue' : 'By Invoices'}
            </div>
          </div>
          
          <SupplierTable>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Invoices</th>
                <th>Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {topClients.length > 0 ? topClients.map((client, i) => (
                <tr key={i}>
                  <td>{client.name}</td>
                  <td>{client.invoices}</td>
                  <td><span className="rating" style={{ color: '#4CAF50' }}>${parseFloat(client.total_spent).toLocaleString()}</span></td>
                </tr>
              )) : (
                <tr><td colSpan="3" style={{textAlign: 'center', color: '#666'}}>No client data available</td></tr>
              )}
            </tbody>
          </SupplierTable>
        </Card>
      </Grid>
      </div>

      {isExporting && (
          <LoadingOverlay id="loading-overlay">
            <div className="spinner"></div>
            <div>Generating Report...</div>
          </LoadingOverlay>
      )}
      
      {/* Always render the report content but keep it hidden off-screen */}
      <PrintContainer id="print-report-content">
        <div className="header">
          <div>
            <h1>Workshop Craft</h1>
            <p>Performance Report</p>
          </div>
          <div className="meta">
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p>Period: Last {timeRange} Months</p>
          </div>
        </div>

        <div className="summary-row">
          <div className="metric">
            <div className="label">Total Revenue</div>
            <div className="value">${stats.revenue.toLocaleString()}</div>
          </div>
          <div className="metric">
            <div className="label">Total Cost</div>
            <div className="value">${stats.cost.toLocaleString()}</div>
          </div>
          <div className="metric">
            <div className="label">Net Profit</div>
            <div className="value" style={{ color: '#4CAF50' }}>${stats.profit.toLocaleString()}</div>
          </div>
          <div className="metric">
            <div className="label">Profit Margin</div>
            <div className="value">{stats.margin}%</div>
          </div>
        </div>

        <div className="chart-section">
          <h3>Revenue Trend</h3>
          <svg viewBox={`0 0 ${Math.max(revenueData.length * 100, 800)} 350`} style={{ width: '100%', height: '250px', overflow: 'visible' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <line 
                key={i} 
                x1="0" 
                y1={i * 75} 
                x2={Math.max(revenueData.length * 100, 800)} 
                y2={i * 75} 
                stroke="#eee" 
                strokeWidth="1" 
              />
            ))}
            <polyline
              fill="none"
              stroke="#E67E22"
              strokeWidth="3"
              points={revenueData.map((d, i) => `${i * 100 + 50},${300 - (parseFloat(d.revenue) / (maxRevenue || 1)) * 250}`).join(' ')}
            />
            {revenueData.map((d, i) => (
              <g key={i}>
                <circle
                  cx={i * 100 + 50}
                  cy={300 - (parseFloat(d.revenue) / (maxRevenue || 1)) * 250}
                  r="4"
                  fill="#E67E22"
                />
                <text x={i * 100 + 50} y="330" textAnchor="middle" fontSize="12" fill="#666">
                  {d.month}
                </text>
                <text x={i * 100 + 50} y={300 - (parseFloat(d.revenue) / (maxRevenue || 1)) * 250 - 15} textAnchor="middle" fontSize="11" fill="#333" fontWeight="bold">
                  ${parseInt(d.revenue)}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="split-row">
          <div className="section">
            <h3>Top Materials</h3>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Usage Count</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <tr key={i}>
                    <td>{m.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '100px', height: '8px', background: '#eee', borderRadius: '4px' }}>
                          <div style={{ 
                            width: `${(m.count / Math.max(...materials.map(m => m.count), 1)) * 100}%`, 
                            height: '100%', 
                            background: '#E67E22', 
                            borderRadius: '4px' 
                          }} />
                        </div>
                        {m.count}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3>Top Clients</h3>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Invoices</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topClients.slice(0, 8).map((client, i) => (
                  <tr key={i}>
                    <td>{client.name}</td>
                    <td>{client.invoices}</td>
                    <td>${parseFloat(client.total_spent).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PrintContainer>
    </Container>
  );
};

export default Reports;
