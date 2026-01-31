/**
 * Invoice PDF Template
 * Defines the printable layout for Invoices.
 * Used by `html2pdf.js` to generate PDF documents.
 * Styling is CSS-in-JS but targeting print media.
 */
import React from 'react';
import styled from 'styled-components';

const InvoicePaper = styled.div`
  padding: 50px;
  font-family: 'Helvetica Neue', 'Arial', sans-serif;
  background: white;
  color: #111;
  margin: 0 auto;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  width: 100%;
  max-width: 800px; /* A4-ish width */
  box-sizing: border-box;

  @media print {
    padding: 0;
    box-shadow: none;
    max-width: none;
  }
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 50px;
  border-bottom: 2px solid #000;
  padding-bottom: 20px;
`;

const CompanyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-width: 60%;

  .shop-name {
      font-size: 1.5rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 5px 0;
  }

  .detail {
      font-size: 0.9rem;
      color: #333;
      line-height: 1.4;
  }
`;

const LogoBox = styled.div`
  width: 120px;
  height: 120px;
  border: ${props => props.$hasLogo ? 'none' : '2px solid #000'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
      width: 100%;
      height: 100%;
      object-fit: contain;
  }

  span {
      font-weight: bold;
      font-size: 0.8rem;
  }
`;

const MetaGrid = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
`;

const ClientBox = styled.div`
  width: 45%;
  border: 1px solid #333;
  padding: 15px;
  box-sizing: border-box;

  h4 {
    margin: 0 0 15px 0;
    text-transform: uppercase;
    font-size: 0.8rem;
    font-weight: bold;
    color: #666;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
  }

  .client-name {
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 5px;
  }

  .client-detail {
      font-size: 0.95rem;
      color: #444;
      line-height: 1.4;
  }
`;

const InvoiceData = styled.div`
  text-align: right;
  
  h1 {
      font-size: 2rem;
      margin: 0 0 10px 0;
      letter-spacing: 2px;
      text-transform: uppercase;
  }

  .row-data {
      margin-bottom: 5px;
      font-size: 1rem;
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      
      span.label { font-weight: bold; }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 40px;

  th {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 12px 10px;
      text-align: left;
      font-transform: uppercase;
      font-size: 0.85rem;
      font-weight: 700;
      background: #f8f8f8;
  }

  td {
      padding: 12px 10px;
      border-bottom: 1px solid #eee;
      font-size: 0.95rem;
      vertical-align: top;
  }

  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  
  tr:last-child td { border-bottom: 1px solid #000; }
`;

const Totals = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const TotalsTable = styled.table`
  width: 300px;
  border-collapse: collapse;

  td {
      padding: 8px 0;
      font-size: 1rem;
  }

  .label { text-align: left; color: #555; }
  .amount { text-align: right; font-weight: bold; }
  
  .grand-total {
      font-size: 1.25rem;
      border-top: 2px solid #000;
      border-bottom: 2px double #000;
      padding-top: 15px;
      margin-top: 10px;
      
      td { padding-top: 15px; padding-bottom: 5px; }
  }
`;

const Footer = styled.div`
  margin-top: 60px;
  font-style: italic;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  border-top: 1px solid #eee;
  padding-top: 20px;
`;

const InvoiceTemplate = ({ invoice, settings = {} }) => {
  if (!invoice) return null;

  // Provide defaults in case settings are missing
  const shopName = settings.shop_name || "Your Company";
  const shopAddr = settings.shop_address || "123 Industrial Zone";
  const shopPhone = settings.shop_phone || "0555-000-000";
  const logo = settings.logo;

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  return (
    <InvoicePaper>
      <Header>
        <CompanyInfo>
            <div className="shop-name">{shopName}</div>
            <div className="detail">{shopAddr}</div>
            <div className="detail">Tel: {shopPhone}</div>
        </CompanyInfo>
        <LogoBox $hasLogo={!!logo}>
            {logo ? <img src={logo} alt="Logo" /> : <span>LOGO</span>}
        </LogoBox>
      </Header>

      <MetaGrid>
          <ClientBox>
              <h4>Bill To</h4>
              <div className="client-name">{invoice.client_name || 'Walk-in Client'}</div>
              {invoice.client_address && <div className="client-detail">{invoice.client_address}</div>}
              {invoice.client_phone && <div className="client-detail">{invoice.client_phone}</div>}
          </ClientBox>

          <InvoiceData>
              <h1>{invoice.type === 'quote' ? 'QUOTE' : 'INVOICE'}</h1>
              <div className="row-data">
                  <span className="label">No:</span>
                  <span>{invoice.invoice_number || String(invoice.id).slice(0, 6).toUpperCase()}</span>
              </div>
              <div className="row-data">
                  <span className="label">Date:</span>
                  <span>{formatDate(invoice.created_at)}</span>
              </div>
          </InvoiceData>
      </MetaGrid>

      <Table>
          <thead>
              <tr>
                  <th style={{width: '50px'}} className="center">#</th>
                  <th>Designation</th>
                  <th style={{width: '60px'}} className="center">Qty</th>
                  <th style={{width: '100px'}} className="right">Unit Price</th>
                  <th style={{width: '100px'}} className="right">Total</th>
              </tr>
          </thead>
          <tbody>
              {invoice.items && invoice.items.length > 0 ? invoice.items.map((item, index) => (
                  <tr key={index}>
                      <td className="center">{index + 1}</td>
                      <td>
                        <div className="bold">{item.description}</div>
                        {item.dimensions && <div style={{fontSize: '0.8rem', color: '#666'}}>{item.dimensions}</div>}
                      </td>
                      <td className="center">{item.quantity}</td>
                      <td className="right">{formatCurrency(item.unit_price)}</td>
                      <td className="right">{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
              )) : (
                <tr><td colSpan="5" className="center">No items</td></tr>
              )}
          </tbody>
      </Table>

      <Totals>
          <TotalsTable>
              <tbody>
                  <tr>
                      <td className="label">Materials Subtotal:</td>
                      <td className="amount">{formatCurrency((invoice.items || []).reduce((acc, item) => acc + (Number(item.total_price) || (Number(item.quantity) * Number(item.unit_price))), 0))}</td>
                  </tr>
                  {Number(invoice.labor_cost) > 0 && (
                     <tr>
                        <td className="label">Labor / Service:</td>
                        <td className="amount">{formatCurrency(invoice.labor_cost)}</td>
                     </tr>
                  )}
                  <tr className="grand-total">
                      <td className="label">Total:</td>
                      <td className="amount">{formatCurrency(invoice.total_amount)}</td>
                  </tr>
              </tbody>
          </TotalsTable>
      </Totals>

      <Footer>
          * Thank you for your business *
      </Footer>
    </InvoicePaper>
  );
};

export default InvoiceTemplate;
