import React from 'react';
import styled from 'styled-components';

const ReportContainer = styled.div`
  width: 210mm; /* A4 width */
  min-height: 297mm; /* A4 height */
  padding: 10mm; /* Reduced padding to maximize space */
  background: white;
  color: black;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  /* Reset any global dark mode styles */
  h1, h2, h3, h4, h5, h6, p, span, div, td, th {
    color: black !important; /* Force black text */
  }
`;

const Header = styled.div`
  text-align: center;
  border-bottom: 3px solid #000;
  padding-bottom: 5px;
  margin-bottom: 15px;

  h1 { margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
  p { margin: 2px 0 0 0; font-size: 12px; color: #333 !important; }
`;

const SectionTitle = styled.h3`
  background: #333; /* Dark background */
  color: white !important; /* White text explicitly */
  padding: 6px 10px;
  margin: 15px 0 10px 0;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px; /* Slight rounded corners */
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px; /* Slightly smaller to fit more */
  
  th {
    border-bottom: 2px solid #000;
    background-color: #f8f8f8;
    color: #000 !important;
    text-align: left;
    padding: 6px 4px;
    font-weight: 700;
    text-transform: uppercase;
  }
  
  td {
    border-bottom: 1px solid #ddd;
    padding: 6px 4px;
    color: #000 !important;
  }

  tr:nth-child(even) {
    background-color: #fafafa;
  }

  tr:last-child td { border-bottom: none; }
`;

const SummaryBox = styled.div`
  margin-top: auto;
  border-top: 2px solid black;
  padding-top: 20px;
  
  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 14px;
    
    strong { font-weight: bold; }
  }
  
  .total {
    font-size: 18px;
    font-weight: bold;
    margin-top: 10px;
    border-top: 1px solid #ddd;
    padding-top: 10px;
  }
`;

/**
 * Monthly Report PDF Template
 * Hidden component used only for PDF generation.
 */
const MonthlyReportTemplate = ({ data }) => {
  if (!data) return null;
  const { period, sales, purchases, summary } = data;

  return (
    <ReportContainer id="monthly-report-pdf">
      <Header>
        <h1>Monthly Business Report</h1>
        <p>Period: {period}</p>
        <p>Generated on: {new Date().toLocaleDateString()}</p>
      </Header>

      <SectionTitle>1. Sales Invoices ({sales.length})</SectionTitle>
      <Table>
        <thead>
          <tr>
            <th width="15%">No.</th>
            <th width="15%">Date</th>
            <th width="35%">Client</th>
            <th width="15%" style={{textAlign: 'center'}}>Status</th>
            <th width="10%" style={{textAlign: 'right'}}>Labor</th>
            <th width="10%" style={{textAlign: 'right'}}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sales.map(inv => (
            <tr key={inv.id}>
              <td>#{inv.invoice_number}</td>
              <td>{new Date(inv.created_at).toLocaleDateString()}</td>
              <td>{inv.client_name}</td>
              <td style={{textAlign: 'center', fontWeight: 'bold', fontSize: '10px'}}>
                  {inv.status.toUpperCase()}
              </td>
              <td style={{textAlign: 'right'}}>${Number(inv.labor_cost).toFixed(2)}</td>
              <td style={{textAlign: 'right', fontWeight: 'bold'}}>${Number(inv.total_amount).toFixed(2)}</td>
            </tr>
          ))}
          {sales.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No sales records this month.</td></tr>}
        </tbody>
      </Table>

      <SectionTitle>2. Purchase Invoices ({purchases.length})</SectionTitle>
      <Table>
        <thead>
          <tr>
            <th width="20%">Date</th>
            <th width="30%">Supplier</th>
            <th width="35%">Description</th>
            <th width="15%" style={{textAlign: 'right'}}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map(p => (
            <tr key={p.id}>
              <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
              <td>{p.supplier_name}</td>
              <td>{p.description}</td>
              <td style={{textAlign: 'right'}}>${Number(p.total_amount).toFixed(2)}</td>
            </tr>
          ))}
          {purchases.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No purchase records this month.</td></tr>}
        </tbody>
      </Table>

      <SummaryBox>
        <SectionTitle>3. Financial Summary</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
                <div className="row">
                    <span>Total Sales (Paid):</span>
                    <strong>${summary.total_paid}</strong>
                </div>
                <div className="row">
                    <span>Total Sales (Pending):</span>
                    <strong>${summary.total_pending}</strong>
                </div>
                <div className="row" style={{ color: '#555', fontStyle: 'italic' }}>
                    <span>Total Labor Income:</span>
                    <span>${summary.total_labor}</span>
                </div>
            </div>
            <div>
                <div className="row">
                    <span>Total Purchased (Expenses):</span>
                    <strong style={{color: 'red'}}>-${summary.total_purchased}</strong>
                </div>
                <div className="row total">
                    <span>NET CASH FLOW:</span>
                    <span style={{ color: Number(summary.net_profit) >= 0 ? 'green' : 'red' }}>
                        ${summary.net_profit}
                    </span>
                </div>
            </div>
        </div>
      </SummaryBox>

      <div style={{ marginTop: '20px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
          WOODWORK SHOP MANAGEMENT SYSTEM - AUTOMATED REPORT
      </div>

    </ReportContainer>
  );
};

export default MonthlyReportTemplate;
