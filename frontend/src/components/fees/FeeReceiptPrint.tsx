import React from 'react';
import { School } from 'lucide-react';
import { format } from 'date-fns';

interface FeeReceiptPrintProps {
  payment: any;
  schoolName?: string;
}

export const FeeReceiptPrint: React.FC<FeeReceiptPrintProps> = ({ payment, schoolName = 'JY SCHOOL' }) => {
  if (!payment) return null;

  const formatReceiptNumber = (rNo: string) => {
    if (!rNo) return '';
    if (rNo.includes('-')) {
      const clean = rNo.replace(/[^a-zA-Z0-9]/g, '');
      return 'JY' + clean.substring(0, 8).toUpperCase();
    }
    return rNo;
  };

  const receiptNumber = payment?.receiptNo 
    ? formatReceiptNumber(payment.receiptNo) 
    : ('JY26' + Math.floor(10000000 + Math.random() * 90000000));

  const pendingBalance = payment.feeStructure 
    ? (payment.feeStructure.amount - (payment.feeStructure.feePayments?.reduce((sum: number, p: any) => sum + p.amountPaid, 0) || payment.amountPaid))
    : 0;

  const ReceiptHalf = ({ type }: { type: 'STUDENT COPY' | 'OFFICE COPY' }) => (
    <div className="flex-1 w-[210mm] p-8 flex flex-col justify-between bg-white text-black relative box-border mx-auto overflow-hidden">
      
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <img src="/logo.png" alt="Watermark" className="w-80 h-80 object-contain grayscale" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-indigo-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm border border-slate-100">
              <img src="/logo.png" alt="School Logo" className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-indigo-900">{schoolName}</h1>
              <p className="text-[10px] text-slate-600 font-bold mt-1">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg font-black text-sm tracking-widest text-indigo-800">
              {type}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Date: <strong className="text-slate-800">{format(new Date(payment.createdAt || new Date()), 'dd MMM yyyy')}</strong></p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Receipt No: <strong className="text-slate-800">{receiptNumber}</strong></p>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm h-full">
              <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-extrabold mb-2">Student Details</p>
              <h2 className="text-lg font-black text-slate-900 uppercase">{payment.student?.user?.name || 'N/A'}</h2>
              <div className="grid grid-cols-2 gap-y-2 mt-3 text-sm">
                <div><span className="text-slate-500 text-xs">ID:</span> <span className="font-bold text-slate-800">{payment.student?.rollNo || 'N/A'}</span></div>
                <div><span className="text-slate-500 text-xs">Class:</span> <span className="font-bold text-slate-800">{payment.student?.class?.name}</span></div>
                <div><span className="text-slate-500 text-xs">Section:</span> <span className="font-bold text-slate-800">{payment.student?.class?.section || '-'}</span></div>
                <div><span className="text-slate-500 text-xs">Father:</span> <span className="font-bold text-slate-800">{payment.student?.fatherName || 'N/A'}</span></div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm h-full">
              <p className="text-[10px] text-indigo-600 uppercase tracking-wider font-extrabold mb-2">Payment Details</p>
              <div className="grid grid-cols-2 gap-y-3 text-sm font-medium">
                <div className="text-slate-500">Amount Paid:</div>
                <div className="font-black text-emerald-600 text-base">₹{payment.amountPaid}</div>
                
                <div className="text-slate-500">Method:</div>
                <div className="font-bold text-slate-800">{payment.method}</div>
                
                {payment.utrNumber && (
                  <>
                    <div className="text-slate-500">UTR / Ref:</div>
                    <div className="font-bold text-slate-800">{payment.utrNumber}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 mb-6">
          <table className="w-full text-left border-collapse rounded-lg overflow-hidden border border-slate-200">
            <thead>
              <tr className="bg-indigo-50 text-indigo-900">
                <th className="p-3 text-xs font-extrabold uppercase border-b border-r border-indigo-100">Description</th>
                <th className="p-3 text-xs font-extrabold uppercase border-b border-indigo-100 text-right w-40">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 text-sm font-bold text-slate-800 border-b border-r border-slate-200 bg-white">
                  {payment.feeStructure?.name || 'Tuition Fee'}
                  <div className="text-xs text-slate-500 font-medium mt-1">{payment.remarks || 'Fee Payment'}</div>
                </td>
                <td className="p-4 text-sm font-bold text-slate-800 text-right border-b border-slate-200 bg-white">
                  ₹{payment.amountPaid}
                </td>
              </tr>
              {/* Empty padding rows for professional look */}
              <tr>
                <td className="p-4 border-r border-slate-200 bg-white h-12"></td>
                <td className="p-4 border-slate-200 bg-white"></td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-3 text-sm font-extrabold text-slate-600 text-right uppercase tracking-wider border-t border-r border-slate-200">Total Paid</td>
                <td className="p-3 text-lg font-black text-emerald-600 text-right border-t border-slate-200">
                  ₹{payment.amountPaid}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-3 text-xs font-bold text-slate-500 text-right uppercase tracking-wider border-r border-slate-200">Pending Balance</td>
                <td className="p-3 text-sm font-bold text-rose-500 text-right border-slate-200">
                  ₹{pendingBalance > 0 ? pendingBalance : 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-8 pt-6 border-t-2 border-slate-100 flex justify-between items-end">
          <div className="text-center">
            <p className="text-xs font-bold text-slate-800 border-t border-slate-800 pt-1 mt-8 inline-block px-4">CASHIER / ACCOUNTANT</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium">System Generated Receipt</p>
            <p className="text-[10px] text-slate-400 font-medium">Valid without signature if paid online</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hidden print:flex flex-col fixed top-0 left-0 right-0 bottom-0 bg-white z-[9999] w-full h-[297mm] text-black print:overflow-hidden print:!m-0 print:!p-0 font-sans">
      
      {/* Top Half - Student Copy */}
      <div className="h-[148mm] border-b-2 border-dashed border-slate-300 relative box-border">
        <ReceiptHalf type="STUDENT COPY" />
      </div>

      {/* Bottom Half - Office Copy */}
      <div className="h-[148mm] relative box-border">
        <ReceiptHalf type="OFFICE COPY" />
      </div>

    </div>
  );
};
