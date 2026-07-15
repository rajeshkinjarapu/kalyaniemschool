import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Plus, FileDown, Trash2, Search, X, ChevronDown } from 'lucide-react';
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
  const [selectedFees, setSelectedFees] = useState<{ feeStructureId: string; amountPaid: number }[]>([]);
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Smart student selector states
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Derived unique classes and sections from loaded students
  const uniqueClasses = useMemo(() => {
    const classMap = new Map<string, { id: string; name: string }>(); 
    students.forEach(s => {
      if (s.class) classMap.set(s.class.name, { id: s.class.id, name: s.class.name });
    });
    return Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const uniqueSections = useMemo(() => {
    const sections = new Set<string>();
    students
      .filter(s => !filterClass || s.class?.name === filterClass)
      .forEach(s => { if (s.class?.section) sections.add(s.class.section); });
    return Array.from(sections).sort();
  }, [students, filterClass]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchClass = !filterClass || s.class?.name === filterClass;
      const matchSection = !filterSection || s.class?.section === filterSection;
      const matchName = !searchName || 
        s.user?.name?.toLowerCase().includes(searchName.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchName.toLowerCase());
      return matchClass && matchSection && matchName;
    });
  }, [students, filterClass, filterSection, searchName]);

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
    if (selectedFees.length === 0) {
      toast.error('Please select at least one fee component to pay.');
      return;
    }
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
        payments: selectedFees,
        method,
        remarks,
        utrNumber: method === 'UPI' ? utrNumber : null,
        receiptUrl: method === 'UPI' ? receiptUrl : null,
      });
      toast.success('Payment transaction recorded!');
      setShowModal(false);
      setStudentId('');
      setSelectedFees([]);
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
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Record Tuition Payment</h3>
              <p className="text-xs text-gray-450 mt-1">Select multiple fees to collect them at once.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ── Smart Student Selector ── */}
              <div className="space-y-3">
                <label className="label font-bold">Select Student</label>

                {/* Row 1: Class + Section */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Class</label>
                    <select
                      value={filterClass}
                      onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-400 font-semibold"
                    >
                      <option value="">All Classes</option>
                      {uniqueClasses.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Section</label>
                    <select
                      value={filterSection}
                      onChange={(e) => { setFilterSection(e.target.value); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-400 font-semibold"
                    >
                      <option value="">All Sections</option>
                      {uniqueSections.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Search box with live dropdown */}
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Search by Name or Roll No</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Type student name..."
                      value={searchName}
                      onFocus={() => setShowStudentDropdown(true)}
                      onChange={(e) => { setSearchName(e.target.value); setShowStudentDropdown(true); }}
                      className="w-full pl-8 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                    />
                    {searchName && (
                      <button type="button" onClick={() => { setSearchName(''); setSelectedStudent(null); setStudentId(''); setSelectedFees([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown results */}
                  {showStudentDropdown && (searchName || filterClass || filterSection) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-gray-400 text-center">No students found</div>
                      ) : (
                        filteredStudents.slice(0, 20).map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(s);
                              setStudentId(s.id);
                              setSearchName(s.user.name);
                              setSelectedFees([]);
                              setShowStudentDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-left transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-black text-indigo-600">{s.user.name?.[0]?.toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 dark:text-white">{s.user.name}</p>
                              <p className="text-[10px] text-gray-400">{s.rollNo} • {s.class ? `${s.class.name}-${s.class.section}` : 'No class'}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected student badge */}
                {selectedStudent && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-white">{selectedStudent.user.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 truncate">{selectedStudent.user.name}</p>
                      <p className="text-[10px] text-indigo-500">{selectedStudent.rollNo} • {selectedStudent.class ? `${selectedStudent.class.name}-${selectedStudent.class.section}` : 'No class'}</p>
                    </div>
                    <button type="button" onClick={() => { setSelectedStudent(null); setStudentId(''); setSearchName(''); setSelectedFees([]); }} className="text-indigo-400 hover:text-indigo-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {studentId && (
                <div>
                  <label className="label mb-2">Select Fee Components & Amount</label>
                  <div className="space-y-2 border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-gray-800/20 max-h-48 overflow-y-auto">
                    {(() => {
                      const availableStructures = structures.filter((s) => s.studentId === studentId || s.classId === students.find((st) => st.id === studentId)?.classId);
                      const allPaid = availableStructures.every(s => {
                        const paidSoFar = payments.filter(p => p.studentId === studentId && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amountPaid, 0);
                        return Math.max(0, s.amount - paidSoFar) <= 0;
                      });

                      return (
                        <>
                          {availableStructures.map((s) => {
                            const paidSoFar = payments.filter(p => p.studentId === studentId && p.feeStructureId === s.id).reduce((sum, p) => sum + p.amountPaid, 0);
                            const pendingAmount = Math.max(0, s.amount - paidSoFar);
                            if (pendingAmount <= 0) return null;

                            const isSelected = selectedFees.find(f => f.feeStructureId === s.id);

                            return (
                              <div key={s.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={!!isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedFees([...selectedFees, { feeStructureId: s.id, amountPaid: pendingAmount }]);
                                      } else {
                                        setSelectedFees(selectedFees.filter(f => f.feeStructureId !== s.id));
                                      }
                                    }}
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{s.name}</p>
                                    <p className="text-[10px] text-gray-500">Pending: ₹{pendingAmount}</p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">₹</span>
                                    <input
                                      type="number"
                                      className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                      value={isSelected.amountPaid}
                                      onChange={(e) => {
                                        setSelectedFees(selectedFees.map(f => f.feeStructureId === s.id ? { ...f, amountPaid: Number(e.target.value) } : f));
                                      }}
                                      max={pendingAmount}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {allPaid && (
                            <p className="text-xs text-emerald-600 font-bold text-center py-2">No pending fees found for this student!</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  
                  {selectedFees.length > 0 && (
                    <div className="mt-3 flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Total Amount to Pay</span>
                      <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">₹{selectedFees.reduce((sum, f) => sum + f.amountPaid, 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

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
