import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Plus, FileDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FeeReceiptPrint } from '../../components/fees/FeeReceiptPrint';

export const FeePaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [printPayment, setPrintPayment] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [studentId, setStudentId] = useState('');
  const [feeStructureId, setFeeStructureId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    try {
      const isStudent = user?.role === 'STUDENT';
      const [payRes, studRes, structRes]: any = await Promise.all([
        isStudent ? api.get(`/api/fees/payments?studentId=${user.id}`) : api.get('/api/fees/payments'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures'),
      ]);
      setPayments(payRes.data || payRes || []);
      setStudents(studRes.data.data || studRes.data || []);
      setStructures(structRes.data || structRes || []);
    } catch (e) {
      toast.error('Failed to load transaction records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const uploadToast = toast.loading('Uploading payment receipt...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await api.post('/api/uploads/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data?.url || res.data.url;
      setReceiptUrl(url);
      toast.success('Payment receipt uploaded successfully!', { id: uploadToast });
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload payment receipt.', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (method === 'UPI' && !utrNumber) {
      toast.error('UTR Reference Number is required for UPI payments.');
      return;
    }
    if (method === 'UPI' && !receiptUrl) {
      toast.error('Please upload the transaction receipt screenshot.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/fees/payments', {
        studentId,
        feeStructureId,
        amountPaid: Number(amountPaid),
        method,
        remarks,
        utrNumber: method === 'UPI' ? utrNumber : null,
        receiptUrl: method === 'UPI' ? receiptUrl : null,
      });
      toast.success('Payment transaction recorded!');
      setShowModal(false);
      setStudentId('');
      setFeeStructureId('');
      setAmountPaid('');
      setRemarks('');
      setUtrNumber('');
      setReceiptUrl('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) return;
    const t = toast.loading('Deleting payment...');
    try {
      await api.delete(`/api/fees/payments/${id}`);
      setPayments(payments.filter(p => p.id !== id));
      toast.success('Payment deleted successfully', { id: t });
    } catch {
      toast.error('Failed to delete payment', { id: t });
    }
  };

  const handlePrintReceipt = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setPrintPayment(payment);
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  const exportPaymentsExcel = async () => {
    const importToast = toast.loading('Generating Excel sheet...');
    try {
      const response: any = await api.get('/api/reports/fees', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Fee_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Excel report downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export fees ledger Excel.', { id: importToast });
    }
  };

  const exportPaymentsPdf = async () => {
    const importToast = toast.loading('Generating PDF report...');
    try {
      const response: any = await api.get('/api/reports/fees/pdf', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Fee_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('PDF report downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export fees ledger PDF.', { id: importToast });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Fee Transaction Ledger</h3>
          <p className="text-xs text-gray-400">Track paid, pending and overdue tuition invoices.</p>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
            <>
              <button
                onClick={exportPaymentsExcel}
                className="btn-secondary flex items-center gap-2 text-sm text-emerald-600 border border-emerald-100/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 cursor-pointer"
              >
                <FileDown className="w-4.5 h-4.5" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={exportPaymentsPdf}
                className="btn-secondary flex items-center gap-2 text-sm text-indigo-600 border border-indigo-100/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/10 cursor-pointer"
              >
                <FileDown className="w-4.5 h-4.5" />
                <span>Export PDF</span>
              </button>
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                <Link to="/fees/structures" className="btn-secondary text-sm">
                  Structure Settings
                </Link>
              )}
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4.5 h-4.5" />
                <span>Collect Payment</span>
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Fee Structure</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Receipt No</th>
                <th className="px-6 py-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 font-semibold">{p.student?.user?.name || 'Unknown student'}</td>
                  <td className="px-6 py-4 text-gray-500">{p.feeStructure?.name || 'Deleted structure'}</td>
                  <td className="px-6 py-4 font-bold">₹{p.amountPaid.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={p.method === 'UPI' ? 'danger' : 'info'}>{p.method}</Badge>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-400 opacity-70 truncate max-w-[120px]">{p.receiptNo}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handlePrintReceipt(p.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer"
                      title="Print Dual Receipt"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Record Tuition Payment</h3>
              <p className="text-xs text-gray-450 mt-1">Manual collection log entry for fees ledger.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Student</label>
                <select
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    const selectedStructure = structures.find(s => s.id === feeStructureId);
                    if (selectedStructure && feeStructureId) {
                      const paidSoFar = payments.filter(p => p.studentId === e.target.value && p.feeStructureId === feeStructureId).reduce((sum, p) => sum + p.amountPaid, 0);
                      setAmountPaid(Math.max(0, selectedStructure.amount - paidSoFar).toString());
                    }
                  }}
                  className="input text-xs"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.name} ({s.rollNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Select Fee Component</label>
                <select
                  value={feeStructureId}
                  onChange={(e) => {
                    setFeeStructureId(e.target.value);
                    const selected = structures.find(s => s.id === e.target.value);
                    if (selected && studentId) {
                      const paidSoFar = payments.filter(p => p.studentId === studentId && p.feeStructureId === e.target.value).reduce((sum, p) => sum + p.amountPaid, 0);
                      setAmountPaid(Math.max(0, selected.amount - paidSoFar).toString());
                    }
                  }}
                  className="input text-xs"
                >
                  <option value="">Select Structure</option>
                  {structures
                    .filter((s) => !studentId || s.studentId === studentId || s.classId === students.find((st) => st.id === studentId)?.classId)
                    .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ₹{s.amount.toLocaleString()} ({s.studentId ? 'Personal Fee' : s.class?.name || 'All'})
                    </option>
                  ))}
                </select>
                {feeStructureId && studentId && (
                  <p className="text-xs text-red-500 font-bold mt-1.5">
                    Pending Amount: ₹{Math.max(0, (structures.find(s => s.id === feeStructureId)?.amount || 0) - payments.filter(p => p.studentId === studentId && p.feeStructureId === feeStructureId).reduce((sum, p) => sum + p.amountPaid, 0)).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="label">Amount to Pay Now (₹)</label>
                <input
                  type="number"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Payment Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="input text-xs">
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online Transfer</option>
                  <option value="BANK_TRANSFER">Bank Deposit</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI / QR Code</option>
                </select>
              </div>

              {/* UPI fields */}
              {method === 'UPI' && (
                <div className="space-y-4 border-l-2 border-primary-500 pl-3.5 my-2">
                  <div>
                    <label className="label">UPI UTR Reference Number</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 12-digit transaction number"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="label">Upload Payment Receipt</label>
                    <input
                      type="file"
                      required={!receiptUrl}
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />
                    {isUploading && (
                      <span className="text-xxs text-primary-500 block mt-1 animate-pulse">
                        Uploading receipt...
                      </span>
                    )}
                    {receiptUrl && (
                      <span className="text-xxs text-emerald-600 font-bold block mt-1">
                        ✓ Receipt uploaded successfully
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared full balance"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="btn-primary text-sm"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Component */}
      <FeeReceiptPrint payment={printPayment} />
    </div>
  );
};
export default FeePaymentsPage;
