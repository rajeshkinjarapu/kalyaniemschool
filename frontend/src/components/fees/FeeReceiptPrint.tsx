import React from 'react';
import { School, Scissors } from 'lucide-react';
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
    <div className="flex-1 w-[210mm] p-10 flex flex-col justify-between bg-white text-black relative box-border mx-auto overflow-hidden">
      
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <div className="w-[120mm] h-[120mm] rounded-full border-[10px] border-slate-900 flex items-center justify-center">
           <span className="text-8xl font-black tracking-tighter text-slate-900">JY</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col h-full border-[3px] border-double border-slate-800 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-slate-800 pb-5 mb-5 relative">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm border border-slate-200">
              <img src="/logo.png" alt="School Logo" className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-[0.15em] text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>{schoolName}</h1>
              <p className="text-[11px] text-slate-600 font-bold mt-1.5 uppercase tracking-widest">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-5 py-2 bg-slate-900 border border-slate-900 rounded-sm font-black text-xs tracking-[0.2em] text-white">
              {type}
            </div>
            <div className="mt-3 text-right space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Date: <span className="text-slate-900">{format(new Date(payment.createdAt || new Date()), 'dd MMM yyyy')}</span></p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Receipt No: <span className="text-slate-900">{receiptNumber}</span></p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 border border-slate-300 h-full">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-3 border-b border-slate-300 pb-1 inline-block">Student Details</p>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">{payment.student?.user?.name || 'N/A'}</h2>
              <div className="grid grid-cols-2 gap-y-2 mt-3 text-sm">
                <div><span className="text-slate-500 text-xs font-bold uppercase">ID:</span> <span className="font-extrabold text-slate-800">{payment.student?.rollNo || 'N/A'}</span></div>
                <div><span className="text-slate-500 text-xs font-bold uppercase">Class:</span> <span className="font-extrabold text-slate-800">{payment.student?.class?.name}</span></div>
                <div><span className="text-slate-500 text-xs font-bold uppercase">Section:</span> <span className="font-extrabold text-slate-800">{payment.student?.class?.section || '-'}</span></div>
                <div><span className="text-slate-500 text-xs font-bold uppercase">Father:</span> <span className="font-extrabold text-slate-800">{payment.student?.fatherName || 'N/A'}</span></div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 border border-slate-300 h-full">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-3 border-b border-slate-300 pb-1 inline-block">Payment Details</p>
              <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
                <div className="text-slate-500 font-bold uppercase text-xs">Amount Paid:</div>
                <div className="font-black text-slate-900 text-base">₹{payment.amountPaid}</div>
                
                <div className="text-slate-500 font-bold uppercase text-xs">Method:</div>
                <div className="font-extrabold text-slate-800">{payment.method}</div>
                
                {payment.utrNumber && (
                  <>
                    <div className="text-slate-500 font-bold uppercase text-xs">UTR / Ref:</div>
                    <div className="font-extrabold text-slate-800 break-all">{payment.utrNumber}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 mb-4">
          <table className="w-full text-left border-collapse border-2 border-slate-800">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b-2 border-slate-800">
                <th className="p-3 text-[11px] tracking-widest font-black uppercase border-r-2 border-slate-800">Description</th>
                <th className="p-3 text-[11px] tracking-widest font-black uppercase text-right w-48">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 text-sm font-black text-slate-800 border-b border-r-2 border-slate-800 bg-white">
                  {payment.feeStructure?.name || 'Tuition Fee'}
                  <div className="text-xs text-slate-500 font-bold mt-1 uppercase">{payment.remarks || 'Fee Payment'}</div>
                </td>
                <td className="p-4 text-base font-black text-slate-800 text-right border-b border-slate-800 bg-white">
                  ₹{payment.amountPaid}
                </td>
              </tr>
              {/* Empty padding rows for professional look */}
              <tr>
                <td className="p-4 border-r-2 border-slate-800 bg-white h-12"></td>
                <td className="p-4 bg-white"></td>
              </tr>
              <tr className="bg-slate-50 border-t-2 border-slate-800">
                <td className="p-3 text-xs font-black text-slate-900 text-right uppercase tracking-[0.2em] border-r-2 border-slate-800">Total Paid</td>
                <td className="p-3 text-lg font-black text-slate-900 text-right">
                  ₹{payment.amountPaid}
                </td>
              </tr>
              <tr className="bg-white border-t border-slate-300">
                <td className="p-3 text-[10px] font-black text-slate-500 text-right uppercase tracking-[0.2em] border-r-2 border-slate-800">Pending Balance</td>
                <td className="p-3 text-sm font-black text-slate-600 text-right">
                  ₹{pendingBalance > 0 ? pendingBalance : 0}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="mt-auto pt-6 flex justify-between items-end">
          <div className="text-center w-48">
            <div className="h-0 border-b-2 border-slate-900 w-full mb-2"></div>
            <p className="text-[10px] font-black tracking-widest uppercase text-slate-800">Cashier / Accountant</p>
          </div>
          <div className="text-right">
             <div className="w-20 h-20 rounded-full border-[3px] border-double border-slate-300 flex items-center justify-center mx-auto mb-2 relative z-0">
               <span className="text-slate-400 font-black uppercase tracking-[0.1em] text-[8px] rotate-[-20deg] text-center leading-tight">School<br/>Seal</span>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">System Generated Receipt</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Valid without signature if paid online</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hidden print:flex flex-col fixed top-0 left-0 right-0 bottom-0 bg-white z-[9999] w-full h-[297mm] text-black print:overflow-hidden print:!m-0 print:!p-0 font-sans">
      
      {/* Top Half - Student Copy */}
      <div className="h-[148mm] relative box-border">
        <ReceiptHalf type="STUDENT COPY" />
        
        {/* Cutting Line */}
        <div className="absolute bottom-0 left-8 right-8 border-b-2 border-dashed border-slate-400 flex items-center justify-center translate-y-1/2 z-50">
          <div className="bg-white px-3 flex items-center gap-2 text-slate-400">
            <Scissors className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Cut Here</span>
            <Scissors className="w-4 h-4 rotate-180" />
          </div>
        </div>
      </div>

      {/* Bottom Half - Office Copy */}
      <div className="h-[148mm] relative box-border mt-[1mm]">
        <ReceiptHalf type="OFFICE COPY" />
      </div>

    </div>
  );
};
