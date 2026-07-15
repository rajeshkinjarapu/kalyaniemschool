import React from 'react';
import './Receipt.css';

type ReceiptProps = {
  studentName: string;
  receiptNo: string;
  date: string;
  amount: string;
  method?: string;
  remarks?: string;
  // add other fields as needed
};

const ReceiptCopy: React.FC<{ title: string; data: ReceiptProps }> = ({ title, data }) => {
  return (
    <div className="receipt-copy" aria-label={`${title} copy`}>
      <header className="receipt-header">
        <div className="logo">
          {/* Replace with your logo img or svg */}
          <img src="/logo192.png" alt="JY School logo" />
        </div>
        <div className="school-info">
          <h1>JY SCHOOL</h1>
          <p className="address">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
        </div>
        <div className="copy-badge">{title}</div>
      </header>

      <section className="receipt-meta">
        <div className="student-details card">
          <h3>Student Details</h3>
          <p className="bold">{data.studentName}</p>
          <p>ID: <span>--</span></p>
          <p>Class: <span>--</span></p>
        </div>

        <div className="payment-details card">
          <h3>Payment Details</h3>
          <p>Amount Paid: <span className="bold">{data.amount}</span></p>
          <p>Method: <span>{data.method || 'CASH'}</span></p>
          <p>Date: <span>{data.date}</span></p>
          <p>Receipt No: <span>{data.receiptNo}</span></p>
        </div>
      </section>

      <section className="payment-breakdown">
        <div className="card">
          <h4>Payment Breakdown</h4>
          <table className="breakdown-table">
            <tbody>
              <tr>
                <td>Tuition Fee</td>
                <td className="amount">{data.amount}</td>
              </tr>
              <tr>
                <td>Remarks</td>
                <td className="light">{data.remarks || '-'}</td>
              </tr>
              <tr className="total">
                <td>Total Paid</td>
                <td className="amount">{data.amount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer className="receipt-footer">
        <div>Prepared by: <span>Reception</span></div>
        <div className="signature">Signature</div>
      </footer>
    </div>
  );
};

const Receipt: React.FC<{ data: ReceiptProps }> = ({ data }) => {
  return (
    <div className="receipt-a4">
      <div className="receipt-inner">
        <ReceiptCopy title="STUDENT COPY" data={data} />
        <div className="cut-line" aria-hidden>
          <span className="scissor" dangerouslySetInnerHTML={{__html: scissorsSVG}} />
          <span className="cut-text">CUT HERE</span>
        </div>
        <ReceiptCopy title="OFFICE COPY" data={data} />
      </div>
    </div>
  );
};

const scissorsSVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M9.5 9.5L20 2M9.5 9.5L20 17M9.5 9.5C11 11 11 13 9.5 14.5C8 16 6 16 4.5 14.5C3 13 3 11 4.5 9.5C6 8 8 8 9.5 9.5Z" stroke="#666" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export default Receipt;
