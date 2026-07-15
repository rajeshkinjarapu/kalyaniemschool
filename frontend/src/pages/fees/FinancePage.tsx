import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import {
  CreditCard, Plus, FileDown, ShieldCheck, Printer, ArrowRight,
  TrendingUp, Wallet, Award, Briefcase, DollarSign, Layers,
  Receipt, FileText, Search, Filter, Trash2, Edit3, Calendar,
  Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT';

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'payment-method';

  const [loading, setLoading] = useState(true);

  // Database-backed states
  const [payments, setPayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // CRUD States for Structures (Admin only)
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [structClassId, setStructClassId] = useState('');
  const [structGroup, setStructGroup] = useState('Tuition fee');
  const [structName, setStructName] = useState('');
  const [structAmount, setStructAmount] = useState('');
  const [structStatus, setStructStatus] = useState('Active');
  // CRUD States for Payments (Admin only)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payStudentId, setPayStudentId] = useState('');
  const [payStructureId, setPayStructureId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRemarks, setPayRemarks] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Local storage states for Finance configuration (Mock Persistence)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [feeGroups, setFeeGroups] = useState<any[]>([]);
  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [feeConcessions, setFeeConcessions] = useState<any[]>([]);
  const [ledgerTypes, setLedgerTypes] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Bulk Upload Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load backend and configurations
  const fetchData = async () => {
    setLoading(true);
    try {
      const isStudent = user?.role === 'STUDENT';
      const [payRes, studRes, structRes, classRes]: any = await Promise.all([
        api.get('/api/fees/payments'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/students'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/fees/structures'),
        isStudent ? Promise.resolve({ data: [] }) : api.get('/api/classes'),
      ]);

      const paymentData = Array.isArray(payRes.data)
        ? payRes.data
        : Array.isArray(payRes)
          ? payRes
          : [];
      const uniquePayments = [...new Map(paymentData.map((p: any) => [p.id, p])).values()];
      setPayments(uniquePayments);
      setStudents(studRes.data.data || studRes.data || []);
      setStructures(structRes.data || structRes || []);
      setClasses(classRes.data || classRes || []);
    } catch (e) {
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Init Mock configurations in LocalStorage
    const initMock = (key: string, defaults: any[]) => {
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(stored);
    };

    setPaymentMethods(initMock('fin_payment_methods', [
      { id: '1', name: 'Cash', isActive: true, notes: 'Direct cash collection at counter' },
      { id: '2', name: 'UPI / PhonePe / GPay', isActive: true, notes: 'Instant UPI transfer' },
      { id: '3', name: 'Bank Transfer / IMPS', isActive: true, notes: 'Direct bank settlement' },
      { id: '4', name: 'Credit / Debit Card', isActive: false, notes: 'POS machine or payment gateway' },
    ]));

    setFeeGroups(initMock('fin_fee_groups', [
      { id: '1', name: 'Academic Fees', description: 'Standard tuition and examination fees' },
      { id: '2', name: 'Transport Fees', description: 'Bus commute and route subscription fees' },
      { id: '3', name: 'Hostel Fees', description: 'Room rent, mess, and utility expenses' },
      { id: '4', name: 'Extracurricular Fees', description: 'Sports, events, and lab equipment charges' },
    ]));

    setFeeHeads(initMock('fin_fee_heads', [
      { id: '1', name: 'Tuition fee', groupId: '1', description: 'Academic tuition' },
      { id: '2', name: 'Admission fee', groupId: '1', description: 'One-time admission charge' },
      { id: '3', name: 'Books Fee', groupId: '2', description: 'Cost of books and materials' },
      { id: '4', name: 'Other Fee', groupId: '3', description: 'Other miscellaneous fees' },
    ]));

    setFeeConcessions(initMock('fin_fee_concessions', [
      { id: '1', name: 'Sibling Waiver (10%)', type: 'PERCENT', value: 10 },
      { id: '2', name: 'Staff Child Discount (50%)', type: 'PERCENT', value: 50 },
      { id: '3', name: 'Sports Merit Scholarship', type: 'FIXED', value: 5000 },
    ]));

    setLedgerTypes(initMock('fin_ledger_types', [
      { id: '1', name: 'Revenue (Income)' },
      { id: '2', name: 'Expense' },
      { id: '3', name: 'Asset (Bank/Cash)' },
      { id: '4', name: 'Liability' },
    ]));

    setLedgers(initMock('fin_ledgers', [
      { id: '1', name: 'Tuition Fee Revenue A/C', typeId: '1' },
      { id: '2', name: 'Bus Fee Revenue A/C', typeId: '1' },
      { id: '3', name: 'JY SCHOOL Operations Bank A/C', typeId: '3' },
      { id: '4', name: 'Petty Cash Counter A/C', typeId: '3' },
    ]));
  }, [user]);

  // Save mocks back to local storage
  const saveMock = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  /* ── Tab Change Helper ── */
  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  /* ── CRUD Functions ── */
  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = structGroup === 'Other Fee' ? structName : structGroup;
    try {
      const res: any = await api.post('/api/fees/structures', {
        classId: structClassId,
        term: 'General',
        name: finalName,
        amount: Number(structAmount),
        dueDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(),
      });
      
      const newStructure = res.data || res;
      if (newStructure && newStructure.id) {
        // Save metadata to localStorage
        const storedMeta = localStorage.getItem('fin_structure_metadata');
        const meta = storedMeta ? JSON.parse(storedMeta) : {};
        meta[newStructure.id] = {
          group: structGroup,
          status: structStatus
        };
        localStorage.setItem('fin_structure_metadata', JSON.stringify(meta));
      }

      toast.success('Fee structure added successfully!');
      setShowStructureModal(false);
      fetchData();
      setStructName('');
      setStructAmount('');
      setStructGroup('Tuition fee');
      setStructStatus('Active');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add structure');
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const importToast = toast.loading('Uploading fees...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res: any = await api.post('/api/fees/structures/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data || res;
      toast.success(`Import complete! Added ${data.success} fees.`, { id: importToast });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Bulk import failed. Please verify format rules.', { id: importToast });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPayment) return;
    if (!payStudentId || !payStructureId || !payAmount || Number(payAmount) <= 0) {
      toast.error('Please select a student, fee component and enter a valid amount.');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      await api.post('/api/fees/payments', {
        studentId: payStudentId,
        feeStructureId: payStructureId,
        amountPaid: Number(payAmount),
        method: payMethod,
        remarks: payRemarks,
      });
      toast.success('Payment transaction recorded!');
      setShowPaymentModal(false);
      fetchData();
      setPayStudentId('');
      setPayStructureId('');
      setPayAmount('');
      setPayRemarks('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Helper selectors
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name}-${cls.section}` : '';
  };

  // Filtered Payments for transaction tab
  const filteredPayments = payments.filter(p => {
    const studentName = p.student?.user?.name?.toLowerCase() || '';
    const feeName = p.feeStructure?.name?.toLowerCase() || '';
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) || feeName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ══ LEFT SIDEBAR TABS (Matching sidebar design) ══ */}
      <div className="print:hidden w-full lg:w-64 shrink-0 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-4 flex flex-col gap-1.5 shadow-sm">
        <div className="px-3 py-2 text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800 mb-2">
          <Wallet className="w-4 h-4 text-indigo-500" />
          Finance Submenu
        </div>

        {[
          { key: 'payment-method', label: 'Payment Method', icon: CreditCard },
          { key: 'fee-group', label: 'Fee Group', icon: Layers },
          { key: 'fee-head', label: 'Fee Head', icon: DollarSign },
          { key: 'fee-concession', label: 'Fee Concession', icon: Award },
          { key: 'fee-structure', label: 'Fee Structure', icon: Briefcase },
          { key: 'transaction', label: 'Transaction', icon: Receipt },
          { key: 'receipt', label: 'Receipt', icon: FileText },
          { key: 'report', label: 'Report', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.01]'
                  : 'text-gray-500 dark:text-gray-450 hover:bg-gray-50 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{tab.label}</span>
              <ArrowRight className={`w-3.5 h-3.5 ml-auto opacity-0 transition-opacity ${isActive ? 'opacity-100' : ''}`} />
            </button>
          );
        })}
      </div>

      {/* ══ RIGHT CONTENT PANEL ══ */}
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm">
        {loading ? (
          <LoadingSpinner size="lg" className="py-24" />
        ) : (
          <>
            {/* ── 1. PAYMENT METHOD TAB ── */}
            {activeTab === 'payment-method' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Payment Methods</h3>
                    <p className="text-xs text-gray-400">Configure modes of payments available for school fees.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map(m => (
                    <div key={m.id} className="p-5 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{m.name}</span>
                        <p className="text-xs text-gray-400">{m.notes}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.isActive ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20' : 'bg-red-50 text-red-650'}`}>
                          {m.isActive ? 'Active' : 'Disabled'}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              const updated = paymentMethods.map(item => item.id === m.id ? { ...item, isActive: !item.isActive } : item);
                              setPaymentMethods(updated);
                              saveMock('fin_payment_methods', updated);
                              toast.success('Status updated!');
                            }}
                            className="text-xs text-indigo-500 font-bold hover:underline cursor-pointer"
                          >
                            Toggle
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 2. FEE GROUP TAB ── */}
            {activeTab === 'fee-group' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Fee Groups</h3>
                    <p className="text-xs text-gray-400">Manage categories of fees like Tuition, Hostel, and Transport.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        const name = prompt('Enter Fee Group Name:');
                        const desc = prompt('Enter Description:');
                        if (name) {
                          const updated = [...feeGroups, { id: Date.now().toString(), name, description: desc }];
                          setFeeGroups(updated);
                          saveMock('fin_fee_groups', updated);
                          toast.success('Group added!');
                        }
                      }}
                      className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Group
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-gray-450 border-b border-gray-150 dark:border-gray-800 font-bold">
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Group Name</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Description</th>
                        {isAdmin && <th className="pb-3 text-right text-[10px] uppercase tracking-wider">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {feeGroups.map(g => (
                        <tr key={g.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/10">
                          <td className="py-4 font-bold text-gray-900 dark:text-white">{g.name}</td>
                          <td className="py-4 text-xs text-gray-400">{g.description || '-'}</td>
                          {isAdmin && (
                            <td className="py-4 text-right">
                              <button
                                onClick={() => {
                                  const updated = feeGroups.filter(item => item.id !== g.id);
                                  setFeeGroups(updated);
                                  saveMock('fin_fee_groups', updated);
                                  toast.success('Deleted!');
                                }}
                                className="text-red-500 hover:text-red-650 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 3. FEE HEAD TAB ── */}
            {activeTab === 'fee-head' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Fee Heads</h3>
                    <p className="text-xs text-gray-400">Define particular components linked to fee groups.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        const name = prompt('Enter Fee Head Name:');
                        const gId = prompt(`Select Group ID:\n${feeGroups.map(g => `${g.id}: ${g.name}`).join('\n')}`);
                        const desc = prompt('Enter Description:');
                        if (name && gId) {
                          const updated = [...feeHeads, { id: Date.now().toString(), name, groupId: gId, description: desc }];
                          setFeeHeads(updated);
                          saveMock('fin_fee_heads', updated);
                          toast.success('Fee Head added!');
                        }
                      }}
                      className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Fee Head
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-gray-455 border-b border-gray-150 dark:border-gray-800 font-bold">
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Fee Head</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Associated Group</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Description</th>
                        {isAdmin && <th className="pb-3 text-right text-[10px] uppercase tracking-wider">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {feeHeads.map(h => {
                        const group = feeGroups.find(g => g.id === h.groupId);
                        return (
                          <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/10">
                            <td className="py-4 font-bold text-gray-900 dark:text-white">{h.name}</td>
                            <td className="py-4">
                              <Badge variant="info">{group?.name || 'Default'}</Badge>
                            </td>
                            <td className="py-4 text-xs text-gray-400">{h.description || '-'}</td>
                            {isAdmin && (
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => {
                                    const updated = feeHeads.filter(item => item.id !== h.id);
                                    setFeeHeads(updated);
                                    saveMock('fin_fee_heads', updated);
                                    toast.success('Deleted!');
                                  }}
                                  className="text-red-500 hover:text-red-650 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 4. FEE CONCESSION TAB ── */}
            {activeTab === 'fee-concession' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Fee Concessions</h3>
                    <p className="text-xs text-gray-400">Configure fee waivers or scholarship discount plans.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        const name = prompt('Enter Concession Name:');
                        const type = prompt('Enter Type (PERCENT or FIXED):') || 'PERCENT';
                        const val = prompt('Enter Discount Value:');
                        if (name && val) {
                          const updated = [...feeConcessions, { id: Date.now().toString(), name, type, value: Number(val) }];
                          setFeeConcessions(updated);
                          saveMock('fin_fee_concessions', updated);
                          toast.success('Concession added!');
                        }
                      }}
                      className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Concession
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feeConcessions.map(c => (
                    <div key={c.id} className="p-5 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</span>
                        <p className="text-xs text-indigo-500 font-extrabold">{c.type === 'PERCENT' ? `${c.value}% Off` : `₹${c.value.toLocaleString()} Off`}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => {
                            const updated = feeConcessions.filter(item => item.id !== c.id);
                            setFeeConcessions(updated);
                            saveMock('fin_fee_concessions', updated);
                            toast.success('Deleted!');
                          }}
                          className="text-red-500 hover:text-red-650 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {/* ── 5. FEE STRUCTURE TAB (FEES MASTER) ── */}
            {activeTab === 'fee-structure' && (
              <div className="space-y-6 animate-fade-in">
                {/* Breadcrumbs matching screenshot */}
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Fees Master</h3>
                    <p className="text-xs text-indigo-500 font-semibold mt-0.5">Home / Fees Master</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleBulkImport}
                      />
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,'; // Optional: add an empty excel base64 string or link to a real template. We'll generate a CSV for simplicity
                          const csvContent = "data:text/csv;charset=utf-8,Student ID,Fee Name,Amount\nJY24-001,Tuition fee,500";
                          const encodedUri = encodeURI(csvContent);
                          const tempLink = document.createElement("a");
                          tempLink.setAttribute("href", encodedUri);
                          tempLink.setAttribute("download", "fees_import_template.csv");
                          document.body.appendChild(tempLink);
                          tempLink.click();
                          document.body.removeChild(tempLink);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <FileDown className="w-4 h-4" /> Get Template
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" /> Import Fees
                      </button>
                      <button
                        onClick={() => {
                          if (classes.length === 0) {
                            toast.error('Please configure classes first');
                            return;
                          }
                          setStructClassId(classes[0]?.id || '');
                          setShowStructureModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Fee Component
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {classes.map(cls => {
                    const classFees = structures.filter(s => s.classId === cls.id);
                    if (classFees.length === 0) return null;
                    const totalFee = classFees.reduce((acc, curr) => acc + curr.amount, 0);

                    return (
                      <div key={cls.id} className="bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{cls.name}</h4>
                            <span className="text-xs text-gray-500 font-medium">Section: {cls.section}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Fees</span>
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">₹{totalFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {classFees.map(fee => {
                            const storedMeta = localStorage.getItem('fin_structure_metadata');
                            const meta = storedMeta ? JSON.parse(storedMeta) : {};
                            const sMeta = meta[fee.id] || { group: 'Annual Fees' };
                            
                            return (
                              <div key={fee.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex-1 min-w-0 pr-4">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fee.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">{sMeta.group}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">₹{fee.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  {isAdmin && (
                                    <button
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this fee?')) {
                                          try {
                                            await api.delete(`/api/fees/structures/${fee.id}`);
                                            toast.success('Fee deleted!');
                                            fetchData();
                                          } catch (e: any) {
                                            toast.error(e.message || 'Failed to delete');
                                          }
                                        }
                                      }}
                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {structures.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="w-8 h-8 text-gray-300" />
                      </div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white mb-1">No Fee Structures</h4>
                      <p className="text-sm text-gray-400 font-medium">Click on "Add Fee Component" to create structures for classes.</p>
                    </div>
                  )}
                </div>

                {/* Structure Creation Modal */}
                {showStructureModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-xs">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl max-w-md w-full space-y-4 animate-scale-in">
                      <h4 className="text-base font-extrabold text-gray-900 dark:text-white border-b pb-2 mb-2">Create Fee Structure</h4>
                      <form onSubmit={handleAddStructure} className="space-y-4">
                        <div className="space-y-1">
                          <label className="label">Class</label>
                          <select className="input" value={structClassId} onChange={e => setStructClassId(e.target.value)} required>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="label">Fee Category</label>
                          <select className="input" value={structGroup} onChange={e => setStructGroup(e.target.value)} required>
                            <option value="Tuition fee">Tuition fee</option>
                            <option value="Admission fee">Admission fee</option>
                            <option value="Books Fee">Books Fee</option>
                            <option value="Other Fee">Other Fee...</option>
                          </select>
                        </div>
                        {structGroup === 'Other Fee' && (
                          <div className="space-y-1">
                            <label className="label">Custom Fee Name</label>
                            <input type="text" className="input" value={structName} onChange={e => setStructName(e.target.value)} placeholder="e.g. Sports Fee" required />
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="label">Amount (USD / INR)</label>
                          <input type="number" className="input" value={structAmount} onChange={e => setStructAmount(e.target.value)} placeholder="1000.00" required />
                        </div>
                        <div className="space-y-1">
                          <label className="label">Status</label>
                          <select className="input" value={structStatus} onChange={e => setStructStatus(e.target.value)} required>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowStructureModal(false)} className="btn-secondary">Cancel</button>
                          <button type="submit" className="btn-primary">Save Structure</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}



            {/* ── 8. TRANSACTION TAB ── */}
            {activeTab === 'transaction' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Transaction Logs</h3>
                    <p className="text-xs text-gray-400">List of fee collections and transaction statements.</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (students.length === 0 || structures.length === 0) {
                          toast.error('Ensure students and structures exist');
                          return;
                        }
                        const firstStudentId = students[0]?.id || '';
                        const firstStructureId = structures[0]?.id || '';
                        setPayStudentId(firstStudentId);
                        setPayStructureId(firstStructureId);
                        
                        const paidSoFar = payments.filter(p => p.studentId === firstStudentId && p.feeStructureId === firstStructureId).reduce((sum, p) => sum + p.amountPaid, 0);
                        const initialAmount = Math.max(0, (structures[0]?.amount || 0) - paidSoFar);
                        setPayAmount(initialAmount.toString());
                        setShowPaymentModal(true);
                      }}
                      className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Record Transaction
                    </button>
                  )}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10"
                      placeholder="Search student or fee title..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      className="input py-2 text-xs font-bold"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All Status</option>
                      <option value="PAID">Paid</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-gray-450 border-b border-gray-150 dark:border-gray-800 font-bold">
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Student</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Fee Category</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Amount Paid</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Payment Method</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-[10px] uppercase tracking-wider text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredPayments.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/10">
                          <td className="py-4">
                            <div className="font-bold text-gray-900 dark:text-white">{p.student?.user?.name || 'Student'}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{p.student?.rollNo || ''}</div>
                          </td>
                          <td className="py-4 text-xs font-semibold text-gray-600 dark:text-gray-300">{p.feeStructure?.name || 'Fees'}</td>
                          <td className="py-4 font-extrabold text-indigo-600 dark:text-indigo-400">₹{p.amountPaid.toLocaleString()}</td>
                          <td className="py-4">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{p.method}</span>
                          </td>
                          <td className="py-4">
                            <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>{p.status}</Badge>
                          </td>
                          <td className="py-4 text-right text-xs text-gray-400 font-semibold">
                            {new Date(p.paymentDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {filteredPayments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">No transactions recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Transaction Entry Modal */}
                {showPaymentModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-xs">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl max-w-md w-full space-y-4 animate-scale-in">
                      <h4 className="text-base font-extrabold text-gray-900 dark:text-white border-b pb-2 mb-2">Record Payment Transaction</h4>
                      <form onSubmit={handleAddPayment} className="space-y-4">
                        <div className="space-y-1">
                          <label className="label">Student</label>
                          <select className="input" value={payStudentId} onChange={e => {
                            setPayStudentId(e.target.value);
                            const selectedStructure = structures.find(s => s.id === payStructureId);
                            if (selectedStructure) {
                              const paidSoFar = payments.filter(p => p.studentId === e.target.value && p.feeStructureId === payStructureId).reduce((sum, p) => sum + p.amountPaid, 0);
                              setPayAmount(Math.max(0, selectedStructure.amount - paidSoFar).toString());
                            }
                          }} required>
                            {students.map(s => <option key={s.id} value={s.id}>{s.user?.name} ({s.rollNo})</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="label">Fee Structure Component</label>
                          <select
                            className="input"
                            value={payStructureId}
                            onChange={e => {
                              setPayStructureId(e.target.value);
                              const selected = structures.find(s => s.id === e.target.value);
                              if (selected) {
                                const paidSoFar = payments.filter(p => p.studentId === payStudentId && p.feeStructureId === e.target.value).reduce((sum, p) => sum + p.amountPaid, 0);
                                setPayAmount(Math.max(0, selected.amount - paidSoFar).toString());
                              }
                            }}
                            required
                          >
                            {structures.map(s => <option key={s.id} value={s.id}>{s.name} - ₹{s.amount}</option>)}
                          </select>
                          {payStructureId && payStudentId && (
                            <p className="text-xs text-red-500 font-bold mt-1">
                              Pending Amount: ₹{Math.max(0, (structures.find(s => s.id === payStructureId)?.amount || 0) - payments.filter(p => p.studentId === payStudentId && p.feeStructureId === payStructureId).reduce((sum, p) => sum + p.amountPaid, 0))}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="label">Amount to Pay Now (₹)</label>
                          <input type="number" className="input" value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <label className="label">Payment Method</label>
                          <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CARD">Credit/Debit Card</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="label">Remarks</label>
                          <input type="text" className="input" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="Optional transaction notes" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                          <button
                            type="submit"
                            disabled={isSubmittingPayment}
                            className={`btn-primary ${isSubmittingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isSubmittingPayment ? 'Recording...' : 'Submit Transaction'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 9. RECEIPT TAB ── */}
            {activeTab === 'receipt' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Payment Receipts</h3>
                    <p className="text-xs text-gray-400">Download and print official fee payment invoices.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payments.map(p => (
                    <div key={p.id} className="p-5 bg-gray-50 dark:bg-gray-800/40 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-xs text-gray-400">Receipt Code: #{p.receiptNo.slice(0, 8)}</span>
                          <h4 className="font-black text-sm text-gray-900 dark:text-white">{p.student?.user?.name || 'Student'}</h4>
                        </div>
                        <Badge variant="success">Paid</Badge>
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="space-y-0.5">
                          <p className="text-gray-450">{p.feeStructure?.name || 'Fees'}</p>
                          <p className="font-extrabold text-indigo-600">₹{p.amountPaid.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-gray-400 text-sm">No payment records found to display receipts.</div>
                  )}
                </div>

                {/* Receipt Invoice Modal (Printable) */}
                {selectedReceipt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-xs">
                    <div className="bg-white p-8 rounded-3xl max-w-xl w-full border border-gray-250 shadow-2xl relative space-y-6">
                      {/* Close button */}
                      <button
                        onClick={() => setSelectedReceipt(null)}
                        className="print:hidden absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-bold cursor-pointer"
                      >
                        ✕
                      </button>

                      {/* Receipt Layout */}
                      <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black text-indigo-700 uppercase tracking-wide">JY SCHOOL</h2>
                        <p className="text-xs text-gray-500">123 Education Street, Knowledge City, State 400001</p>
                        <p className="text-xs text-gray-450 font-bold border-y py-1.5 mt-2 uppercase tracking-widest text-gray-700">Official Fee Receipt</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400 font-semibold">Student Name:</p>
                          <p className="font-extrabold text-gray-800">{selectedReceipt.student?.user?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 font-semibold">Receipt No:</p>
                          <p className="font-extrabold text-gray-800">#{selectedReceipt.receiptNo.slice(0, 16)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-semibold">Roll Number:</p>
                          <p className="font-bold text-gray-800">{selectedReceipt.student?.rollNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 font-semibold">Payment Date:</p>
                          <p className="font-bold text-gray-800">{new Date(selectedReceipt.paymentDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <table className="w-full text-xs text-left border-t border-b">
                        <thead>
                          <tr className="bg-gray-50 font-extrabold text-gray-700">
                            <th className="py-2.5 px-2">Description</th>
                            <th className="py-2.5 px-2 text-right">Amount Paid</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-3 px-2 font-medium text-gray-800">{selectedReceipt.feeStructure?.name}</td>
                            <td className="py-3 px-2 text-right font-extrabold text-gray-900">₹{selectedReceipt.amountPaid.toLocaleString()}</td>
                          </tr>
                          <tr className="bg-gray-50/50 font-black border-t text-sm">
                            <td className="py-2.5 px-2 text-gray-700">Total</td>
                            <td className="py-2.5 px-2 text-right text-indigo-700">₹{selectedReceipt.amountPaid.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="flex justify-between items-center text-xs pt-4">
                        <div>
                          <span className="text-gray-450 block">Payment Mode</span>
                          <span className="font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] mt-0.5 inline-block">{selectedReceipt.method}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-450 block">Receiver Signature</span>
                          <div className="w-32 h-0.5 bg-gray-300 mt-6 inline-block"></div>
                        </div>
                      </div>

                      <div className="print:hidden flex justify-end gap-2 pt-4 border-t">
                        <button onClick={() => setSelectedReceipt(null)} className="btn-secondary">Close</button>
                        <button onClick={() => window.print()} className="btn-primary flex items-center gap-1.5">
                          <Printer className="w-4 h-4" /> Print Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 10. REPORT TAB ── */}
            {activeTab === 'report' && (
              <div className="space-y-6 animate-fade-in">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Financial Statement Reports</h3>
                  <p className="text-xs text-gray-400">Aggregated collection matrices and cash flow audits.</p>
                </div>

                {/* Dashboard stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-650 text-white rounded-3xl space-y-2 shadow-lg shadow-indigo-500/10">
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-85">Total Collection</span>
                    <h4 className="text-3xl font-black">₹{payments.reduce((acc, curr) => acc + curr.amountPaid, 0).toLocaleString()}</h4>
                    <p className="text-[10px] opacity-75">All successful recorded transactions</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-3xl space-y-2 shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Total Active Structures</span>
                    <h4 className="text-3xl font-black text-gray-900 dark:text-white">{structures.length}</h4>
                    <p className="text-[10px] text-gray-400">Currently configured schedules</p>
                  </div>
                  <div className="p-6 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-800 rounded-3xl space-y-2 shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Cash-in-Hand Settlement</span>
                    <h4 className="text-3xl font-black text-teal-650 dark:text-teal-400">
                      ₹{payments.filter(p => p.method === 'CASH').reduce((acc, curr) => acc + curr.amountPaid, 0).toLocaleString()}
                    </h4>
                    <p className="text-[10px] text-gray-400">Collected via counter cash payments</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default FinancePage;
