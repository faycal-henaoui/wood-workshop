/**
 * Purchase Order Template
 * Defines the printable layout for Purchase Orders (Restocking).
 * Rendered during PDF generation for supplier records.
 */
import React from 'react';
import styled from 'styled-components';
import { ShoppingCart } from 'lucide-react';

const InvoicePaper = styled.div`
  padding: 40px;
  font-family: 'Courier New', Courier, monospace;
  background: white;
  color: black;
  margin: 20px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 800px;
  box-sizing: border-box;

  @media (max-width: 600px) {
    padding: 20px;
    margin: 10px auto;
    width: auto;
  }
`;

const CompanyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  border-bottom: 2px solid #000;
  padding-bottom: 20px;

  @media (max-width: 600px) {
    flex-direction: column-reverse; /* Logo top */
    align-items: center;
    text-align: center;
    gap: 20px;
  }

  .company-info {
    h1 { font-size: 1.8rem; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px; }
    p { margin: 2px 0; font-size: 0.9rem; color: #444; }
  }

  .logo {
    width: 100px;
    height: 100px;
    border: 2px solid #000; // Or none for purchase
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.8rem;
    text-align: center;
  }
`;

const InvoiceInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 20px;
  }

  .client-box {
    border: 1px solid #000;
    padding: 15px;
    width: 45%;

    @media (max-width: 600px) {
       width: 100%;
       box-sizing: border-box;
    }
    
    h4 { margin: 0 0 10px 0; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    p { margin: 2px 0; font-size: 0.95rem; }
  }

  .meta-box {
    text-align: right;

    @media (max-width: 600px) {
        text-align: left;
    }

    h2 { margin: 0 0 5px 0; font-size: 1.5rem; }
    p { margin: 2px 0; font-size: 1rem; font-weight: bold; }
  }
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-bottom: 30px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;

  th {
    border-bottom: 2px solid #000;
    border-top: 2px solid #000;
    padding: 10px;
    text-align: left;
    text-transform: uppercase;
    font-size: 0.9rem;
    background: #f9f9f9;
  }

  td {
    padding: 10px;
    border-bottom: 1px solid #eee;
    font-size: 0.95rem;
  }

  .num { text-align: right; }
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  margin-top: 20px;
  border-top: 2px solid #000;
  padding-top: 20px;

  .total-row {
    display: flex;
    justify-content: space-between;
    width: 300px;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .words {
    width: 100%;
    text-align: left;
    font-style: italic;
    color: #555;
    margin-top: 10px;
    font-size: 0.9rem;
  }
`;

const PurchaseTemplate = ({ purchase }) => (
  <InvoicePaper id="purchase-template">
    <CompanyHeader>
      <div className="company-info">
        <h1>PURCHASE ORDER</h1>
        <p>Record of Material Acquisition</p>
      </div>
      <div className="logo" style={{ border: 'none', fontSize: '1.5rem' }}>
        <ShoppingCart size={40} />
      </div>
    </CompanyHeader>

    <InvoiceInfo>
      <div className="client-box">
        <h4>Supplier / Vendor</h4>
        <p><strong>{purchase.supplier_name}</strong></p>
      </div>
      <div className="meta-box">
        <h2>RECEIPT</h2>
        <p>REF: PUR-{purchase.id ? String(purchase.id).slice(0, 8).toUpperCase() : '000'}</p>
        <p>Date: {new Date(purchase.purchase_date).toLocaleDateString()}</p>
      </div>
    </InvoiceInfo>

    <TableWrapper>
    <Table>
      <thead>
        <tr>
          <th>#</th>
          <th>Material / Item</th>
          <th className="num">Qty</th>
          <th className="num">Unit Cost</th>
          <th className="num">Line Total</th>
        </tr>
      </thead>
      <tbody>
        {purchase.items && purchase.items.map((item, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td>{item.material_name || item.description || 'Unknown Item'}</td>
            <td className="num">{item.quantity}</td>
            <td className="num">${Number(item.unit_price).toFixed(2)}</td>
            <td className="num">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
    </TableWrapper>

    <Footer>
      <div className="total-row" style={{ borderTop: '2px solid #000', paddingTop: '5px', marginTop: '5px' }}>
        <span>Total Paid:</span>
        <span>${Number(purchase.total_amount).toFixed(2)}</span>
      </div>
      <div className="words">
        * Stock updated automatically on purchase date *
      </div>
    </Footer>
  </InvoicePaper>
);

export default PurchaseTemplate;
