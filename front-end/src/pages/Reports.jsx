import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, Package, Hammer, Calendar, Download } from 'lucide-react';
import MonthlyReportTemplate from '../components/MonthlyReportTemplate';
import { API_URL } from '../config';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  height: 100%;
  padding-bottom: 50px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    
    h2 { font-size: 1.5rem; }

    /* Target the container of selects - assuming it's the direct div child */
    & > div {
       width: 100%;
       flex-direction: column;
    }
  }

  h2 { font-size: 1.8rem; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: var(--card-bg);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);

  h3 {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .value {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text);
  }

  .sub {
    font-size: 0.8rem;
    margin-top: 5px;
    color: ${props => props.$positive ? '#2ecc71' : props.$negative ? '#e74c3c' : 'var(--text-secondary)'};
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const ChartCard = styled(Card)`
  grid-column: span 2;
  min-height: 350px;
  display: flex;
  flex-direction: column;

  @media (max-width: 1000px) {
    grid-column: span 1;
  }
`;

/**
 * Analytics Reports
 * Visualizations of financial health.
 * Charts include:
 * - Revenue vs Profit vs Labor Cost (Area Chart)
 * - Monthly Revenue Trends
 * - Top Selling Materials
 */
const Reports = () => {
    console.log("Reports Component Rendering...");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(12); // Months
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Paid', 'Pending'

    // Report Export State
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [downloading, setDownloading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const handleDownloadReport = async () => {
        setDownloading(true);
        try {
            const res = await fetch(`${API_URL}/api/report-export/detailed?month=${reportMonth}&year=${reportYear}`);
            const jsonData = await res.json();
            
            if (!res.ok) throw new Error(jsonData.message || 'Failed to fetch report data');

            setReportData(jsonData);

            // Dynamically import html2pdf to ensure it loads only when needed
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default || html2pdfModule;

            // Wait for React to render the hidden template
            setTimeout(() => {
                const element = document.getElementById('monthly-report-pdf');
                const opt = {
                    margin: 0,
                    filename: `Monthly_Report_${reportYear}_${reportMonth}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                html2pdf().from(element).set(opt).save().then(() => {
                    setDownloading(false);
                    setReportData(null); // Cleanup
                });
            }, 500);

        } catch (error) {
            console.error("Export Error:", error);
            alert("Error exporting report: " + error.message);
            setDownloading(false);
        }
    };

    /**
     * Fetch Data
     * Retrieves aggregated financial stats from backend `reports/financials`.
     * Depends on `timeRange` (e.g. 6 months) and `statusFilter` (Paid vs Pending).
     */
    const fetchFinancialData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/reports/financials?months=${timeRange}&status=${statusFilter}`);
            const d = await res.json();
            setData(d);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [timeRange, statusFilter]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const s = data?.summary || { revenue: 0, net_profit: 0, labor_income: 0, material_profit: 0, cogs: 0, purchases_cashflow: 0 }; 
    const profitMargin = s.revenue > 0 ? ((s.net_profit / s.revenue) * 100).toFixed(1) : 0;
    
    // Data for Pie Chart
    const pieData = [
        { name: 'Labor Income', value: Number(s.labor_income) },
        { name: 'Material Profit', value: Number(s.material_profit) },
        { name: 'COGS', value: Number(s.cogs) },
    ];
    const COLORS = ['#3498db', '#2ecc71', '#e74c3c'];

    return (
        <Container>
            {/* Hidden Report Template */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {reportData && <MonthlyReportTemplate data={reportData} />}
            </div>

            <Header>
                <h2>Financial Performance</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    >
                        <option value="All">All Invoices (Accrual)</option>
                        <option value="Paid">Paid Only (Cash)</option>
                        <option value="Pending">Pending Only (Receivables)</option>
                    </select>
                    <select 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    >
                        <option value="1">Last Month</option>
                        <option value="3">Last 3 Months</option>
                        <option value="6">Last 6 Months</option>
                        <option value="12">Last 12 Months</option>
                    </select>
                </div>
            </Header>

            {/* Export Section */}
            <Card style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', border: '2px solid var(--primary)' }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{ background: 'var(--bg)', padding: '10px', borderRadius: '50%' }}>
                        <Calendar size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h3 style={{margin: 0, fontSize: '1rem', color: 'var(--text)'}}>Monthly Report Export</h3>
                        <p style={{margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                            Download a detailed PDF of Sales & Purchases for a specific month.
                        </p>
                    </div>
                </div>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <select 
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        style={{ padding: '10px', borderRadius: '6px', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    >
                        {Array.from({length: 12}, (_, i) => (
                            <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select 
                        value={reportYear}
                        onChange={(e) => setReportYear(e.target.value)}
                        style={{ padding: '10px', borderRadius: '6px', background: 'var(--input-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    >
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button 
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--primary)', color: 'white', border: 'none',
                            padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', 
                            opacity: downloading ? 0.7 : 1, fontWeight: 500
                        }}
                    >
                        <Download size={18} />
                        {downloading ? 'Generating...' : 'Download PDF'}
                    </button>
                </div>
            </Card>

            {loading ? (
                <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>Loading Financial Data...</div>
            ) : !data || !data.summary ? (
                <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-secondary)'}}>No Chart Data Available</div>
            ) : (
            <>
            <Grid>
                <Card>
                    <h3>Total Revenue ({statusFilter})</h3>
                    <div className="value">${Number(s.revenue).toLocaleString()}</div>
                    <div className="sub"><DollarSign size={14}/> Gross Sales</div>
                </Card>
                <Card $positive>
                    <h3>Net Profit ({statusFilter})</h3>
                    <div className="value">${Number(s.net_profit).toLocaleString()}</div>
                    <div className="sub"><TrendingUp size={14}/> {profitMargin}% Margin</div>
                </Card>
                <Card>
                    <h3>Labor Income ({statusFilter})</h3>
                    <div className="value">${Number(s.labor_income).toLocaleString()}</div>
                    <div className="sub"><Hammer size={14}/> Service Revenue</div>
                </Card>
                <Card>
                    <h3>Purchases (Cash Out)</h3>
                    <div className="value">${Number(s.purchases_cashflow).toLocaleString()}</div>
                    <div className="sub"><Package size={14}/> Restocking Cost</div>
                </Card>
            </Grid>

            <Grid>
                <ChartCard>
                    <h3>Revenue vs profit vs Cost</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data.chart_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3498db" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#2ecc71" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} />
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#3498db" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                            <Area type="monotone" dataKey="labor" stroke="#2ecc71" fillOpacity={1} fill="url(#colorProfit)" name="Labor Income" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard style={{ gridColumn: 'span 1' }}>
                    <h3>Profit Composition</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                        Breakdown of where your money goes/comes from<br/>(Inner/Outer: Labor vs Material Profit vs Cost)
                    </div>
                </ChartCard>
            </Grid>

            {/* Detailed Stats Table */}
             <Card>
                <h3>Detailed Value Analysis</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', marginTop: '20px' }}>
                    
                    <div>
                        <h4 style={{borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px'}}>Income Sources</h4>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <span>Labor & Services (Pure Profit)</span>
                            <span style={{fontWeight: 'bold', color: '#2ecc71'}}>${Number(s.labor_income).toLocaleString()}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <span>Material Sales Revenue</span>
                            <span style={{fontWeight: 'bold'}}>${Number(s.revenue - s.labor_income).toLocaleString()}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed var(--border)', fontSize: '1.1rem'}}>
                            <strong>Total Revenue</strong>
                            <strong style={{color: '#3498db'}}>${Number(s.revenue).toLocaleString()}</strong>
                        </div>
                    </div>

                    <div>
                        <h4 style={{borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '15px'}}>Profits & Costs</h4>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <span>Est. Material Cost (COGS)</span>
                            <span style={{fontWeight: 'bold', color: '#e74c3c'}}>-${Number(s.cogs).toLocaleString()}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <span>Profit from Material Markup</span>
                            <span style={{fontWeight: 'bold', color: '#2ecc71'}}>${Number(s.material_profit).toLocaleString()}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed var(--border)', fontSize: '1.2rem'}}>
                            <strong>NET PROFIT</strong>
                            <strong style={{color: '#2ecc71'}}>${Number(s.net_profit).toLocaleString()}</strong>
                        </div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px'}}>
                            * Net Profit = Labor Income + Material Markup
                        </div>
                    </div>

                </div>
            </Card>
            </>
            )}

        </Container>
    );
};

export default Reports;


