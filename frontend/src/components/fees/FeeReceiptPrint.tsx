import React from 'react';
import { format } from 'date-fns';
import { Scissors } from 'lucide-react';

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

  return (
    <div className="hidden print:flex print:flex-col w-full text-slate-900 bg-white print:h-[297mm] print:overflow-hidden print:justify-center">
      {/* 2 Copies (Office Copy & Parent Copy) */}
      {[ 'OFFICE COPY', 'PARENT COPY' ].map((copyType, idx) => (
        <div key={copyType} className={`relative ${idx === 1 ? 'mt-4 border-t-2 border-dashed border-slate-300 pt-4' : ''}`}>
          
          {idx === 1 && (
             <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 flex items-center justify-center bg-white px-4 text-slate-500 text-[10px] uppercase tracking-[0.24em]">
               <Scissors className="w-4 h-4 mr-2" />Cut Here<Scissors className="w-4 h-4 ml-2 rotate-180" />
             </div>
          )}

          <div className="max-w-[800px] mx-auto border-2 border-slate-900 p-4 rounded-lg relative overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider">{schoolName}</h1>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Fee Payment Receipt</p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white px-2 py-0.5 font-black text-[9px] tracking-widest uppercase rounded">
                  {copyType}
                </div>
                <div className="mt-1.5 text-xs font-bold uppercase tracking-wider">
                  Receipt No: {receiptNumber}
                </div>
                <div className="text-[10px] font-semibold text-slate-600">
                  Date: {format(new Date(payment.createdAt || new Date()), 'dd MMM yyyy')}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex flex-col gap-4">
              
              {/* Top Details */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Student Name</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{payment.student?.user?.name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">ID No</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{payment.student?.rollNo || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Class / Sec</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{payment.student?.class ? `${payment.student.class.name} - ${payment.student.class.section}` : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Father's Name</div>
                  <div className="font-bold border-b border-slate-300 pb-1">{payment.student?.fatherName || 'N/A'}</div>
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
                 <table className="w-full text-sm">
                   <thead className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-600 uppercase tracking-widest text-left">
                     <tr>
                       <th className="py-2 px-4 border-r-2 border-slate-900">Description</th>
                       <th className="py-2 px-4 border-r-2 border-slate-900 text-center">Payment Mode</th>
                       <th className="py-2 px-4 text-right">Amount</th>
                     </tr>
                   </thead>
                   <tbody>
                     <tr className="border-b border-slate-300 font-bold">
                       <td className="py-3 px-4 border-r-2 border-slate-900">{payment.feeStructure?.name || 'Tuition Fee'}</td>
                       <td className="py-3 px-4 border-r-2 border-slate-900 text-center">{payment.method}</td>
                       <td className="py-3 px-4 text-right">₹{payment.amountPaid}</td>
                     </tr>
                     {payment.remarks && (
                       <tr className="border-b border-slate-300 font-semibold text-slate-600 text-xs">
                         <td colSpan={3} className="py-2 px-4">Remarks: {payment.remarks}</td>
                       </tr>
                     )}
                     <tr className="font-black text-base bg-slate-50">
                       <td colSpan={2} className="py-3 px-4 border-r-2 border-slate-900 text-right uppercase tracking-widest">Total Paid</td>
                       <td className="py-3 px-4 text-right">₹{payment.amountPaid}</td>
                     </tr>
                   </tbody>
                 </table>
              </div>
              
              <div className="flex justify-between items-center text-sm font-bold bg-slate-100 p-3 rounded-lg border-2 border-slate-300">
                <span className="text-[10px] uppercase tracking-widest text-slate-600">Pending Balance:</span>
                <span className="text-red-600">₹{pendingBalance > 0 ? pendingBalance : 0}</span>
              </div>

            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end mt-12 px-4">
              <div className="text-center">
                <div className="w-40 border-b-2 border-slate-400 mb-2"></div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Collected By</div>
              </div>
              <div className="text-center">
                <div className="w-40 border-b-2 border-slate-400 mb-2"></div>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Received By</div>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};
