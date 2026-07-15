import React from 'react';
import Receipt from '../components/Receipt';

const demo = {
  studentName: 'Menda Komali Devi',
  receiptNo: 'JY70945951',
  date: '15 Jul 2026',
  amount: '₹2000',
  method: 'CASH',
  remarks: 'Fee Payment',
};

export default function ReceiptPreview() {
  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => window.print()} style={{ marginBottom: 12 }}>Print</button>
      <Receipt data={demo} />
    </div>
  );
}
