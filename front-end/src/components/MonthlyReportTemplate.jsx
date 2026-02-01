import React from 'react';
import styled from 'styled-components';

const ReportContainer = styled.div`
  width: 210mm; /* A4 width */
  min-height: 297mm; /* A4 height */
  padding: 20mm;
  background: white;
  color: black;
  font-family: 'Times New Roman', serif;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  text-align: center;
  border-bottom: 2px solid black;
  padding-bottom: 10px;
  margin-bottom: 20px;

  h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
  p { margin: 5px 0 0 0; font-size: 14px; color: #555; }
`;

const SectionTitle = styled.h3`
  background: #f0f0f0;
  padding: 5px 10px;
  margin: 20px 0 10px 0;
  border-left: 5px solid #333;
  font-size: 16px;
  text-transform: uppercase;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  
  th {
    border-bottom: 1px solid black;
    text-align: left;
    padding: 5px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  td {
    border-bottom: 1px solid #ddd;
    padding: 5px;
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
