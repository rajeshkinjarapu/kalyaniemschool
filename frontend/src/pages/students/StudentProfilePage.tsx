import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { getPhotoUrl } from '../../utils/photo';
import { compressImage } from '../../utils/imageCompressor';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Avatar } from '../../components/UI/Avatar';
import { Badge } from '../../components/UI/Badge';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Mail, Phone, Printer, User2, Calendar, 
  Droplet, ClipboardCheck, Users, Fingerprint, 
  Hash, MapPin, Sparkles, GraduationCap, Camera, CreditCard, FileDown, Trash2, Edit2
} from 'lucide-react';
import { FeeReceiptPrint } from '../../components/fees/FeeReceiptPrint';
import { getPhotoUrl } from '../../utils/photo';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [student, setStudent] = useState<any>(null);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [printPayment, setPrintPayment] = useState<any>(null);
  
  // Payment Modal States
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [discountFee, setDiscountFee] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [selectedFees, setSelectedFees] = useState<{ feeStructureId: string; amountPaid: number }[]>([]);
  const [method, setMethod] = useState('CASH');
  const [remarks, setRemarks] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudentProfile = async () => {
    try {
      const [studentRes, structRes]: any = await Promise.all([
        api.get(`/api/students/${id}?_t=${Date.now()}`),
        api.get(`/api/fees/structures?_t=${Date.now()}`),
      ]);
      const studentData = studentRes?.data?.data || studentRes?.data || studentRes;
      const structData = structRes?.data?.data || structRes?.data || structRes || [];
      setStudent(studentData);
      setFeeStructures(structData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... logic remains
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const loadingToast = toast.loading('Uploading photo...');
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const uploadRes: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = uploadRes.data.url || uploadRes.data.data?.url;
      if (!uploadedUrl) throw new Error('Upload returned no URL');
      await api.put(`/api/students/${student.id}`, {
        name: student.user.name,
        photoUrl: uploadedUrl,
      });
      toast.success('Photo updated successfully!', { id: loadingToast });
      fetchStudentProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    const uploadToast = toast.loading('Uploading payment receipt...');
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const res: any = await api.post('/api/uploads/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReceiptUrl(res.data.url || res.data.data?.url);
      toast.success('Receipt uploaded!', { id: uploadToast });
    } catch (err) {
      toast.error('Failed to upload receipt', { id: uploadToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-clicks
    if (selectedFees.length === 0) return toast.error('Please select at least one fee structure to pay.');
    if (method === 'UPI' && !utrNumber) return toast.error('Please enter UTR number');

    setIsSubmitting(true);
    try {
      const payload: any = {
        studentId: student.id,
        payments: selectedFees,
        method,
        remarks,
        paymentDate,
      };

      if (method === 'UPI') {
        payload.utrNumber = utrNumber;
        payload.receiptUrl = receiptUrl;
      }

      await api.post('/api/fees/payments', payload);
      
      toast.success('Payment recorded successfully!');
      setShowModal(false);
      setSelectedFees([]);
      setRemarks('');
      setUtrNumber('');
      setReceiptUrl('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setIsSubmitting(true);
    try {
      await api.put(`/api/fees/payments/${editingPayment.id}`, {
        amountPaid: editingPayment.amountPaid,
        method: editingPayment.method,
        remarks: editingPayment.remarks
      });
      toast.success('Payment updated successfully!');
      setShowEditModal(false);
      setEditingPayment(null);
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.message || 'Error updating payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) return;
    const t = toast.loading('Deleting payment...');
    try {
      await api.delete(`/api/fees/payments/${paymentId}`);
      toast.success('Payment deleted successfully', { id: t });
      fetchStudentProfile();
    } catch {
      toast.error('Failed to delete payment', { id: t });
    }
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountFee) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/fees/discounts`, {
        studentId: student.id,
        feeStructureId: discountFee.id,
        discountAmount: discountFee.amount - discountAmount
      });
      toast.success('Fee discounted successfully!');
      setShowDiscountModal(false);
      setDiscountFee(null);
      setDiscountAmount(0);
      fetchStudentProfile();
    } catch (error: any) {
      toast.error(error.message || 'Error applying discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = (payment: any) => {
    // Populate the correct student object structure for FeeReceiptPrint if needed
    const paymentForPrint = {
      ...payment,
      student: student
    };
    setPrintPayment(paymentForPrint);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!student) return <div className="text-center py-12">Student profile not found.</div>;

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8 animate-fade-in print:max-w-full print:p-0 print:space-y-4">
        
        {/* ================= SCREEN-ONLY VIEW ================= */}
        <div className="space-y-8 print:hidden">
          
          {/* Top Actions Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-4 sm:px-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <Link 
              to="/students" 
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all hover:-translate-x-1"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"><ArrowLeft className="w-4 h-4" /></div>
              <span>Back to Roster</span>
            </Link>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Fee</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 sm:flex-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Profile</span>
              </button>
            </div>
          </div>

          {/* Hero Profile Banner */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl shadow-indigo-100/20 dark:shadow-none group">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-950/20 dark:via-gray-900 dark:to-purple-950/20" />
            <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-400/10 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-fuchsia-400/10 rounded-full blur-3xl -ml-20 -mb-20 transition-transform duration-700 group-hover:scale-110" />

            <div className="relative p-8 sm:p-10 lg:p-12 flex flex-col md:flex-row items-center gap-8 lg:gap-12">
              {/* Interactive Avatar */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative p-1.5 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
                  <Avatar 
                    src={getPhotoUrl(student.user.photoUrl)} 
                    name={student.user.name} 
                    size="lg" 
                    variant="rectangular" 
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover" 
                  />
                  {isAdmin && (
                    <label className="absolute -bottom-4 left-1/2 -translate-x-1/2 cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-full text-xs font-bold shadow-lg transition-transform hover:scale-105 select-none whitespace-nowrap">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploading ? '...' : 'Update'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>

              {/* Core Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                  <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    {student.user.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <Badge variant="info" className="px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-none">
                      #{student.rollNo}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 backdrop-blur-sm shadow-sm">
                    <GraduationCap className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      Class: {student.class ? `${student.class.name}-${student.class.section}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 backdrop-blur-sm shadow-sm">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      Admitted: {new Date(student.admissionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details Masonry/Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column: Demographics & Guardian */}
            <div className="xl:col-span-2 space-y-8">
              
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400"><User2 className="w-5 h-5" /></div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Demographics</h3>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Gender</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {student.gender || 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Date of Birth</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Blood Group</span>
                    <span className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5" /> {student.bloodGroup || 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Aadhar No</span>
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{student.aadharNo || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">PEN Number</span>
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{student.penNumber || 'N/A'}</span>
                  </div>
                </div>
                <div className="px-6 md:px-8 pb-8">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Residential Address</span>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
                      {student.address || 'No address provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400"><Users className="w-5 h-5" /></div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Family & Contacts</h3>
                </div>
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Father's Name</span>
                      <span className="text-base font-bold text-gray-900 dark:text-white">{student.fatherName || 'N/A'}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Mother's Name</span>
                      <span className="text-base font-bold text-gray-900 dark:text-white">{student.motherName || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="relative p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                    <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest block mb-3">Primary Guardian</span>
                    {student.parent ? (
                      <div className="space-y-3">
                        <div className="font-extrabold text-lg text-gray-900 dark:text-white">{student.parent.user.name}</div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                            <Phone className="w-4 h-4 text-amber-500" />
                            {student.parent.user.phone || 'N/A'}
                          </div>
                          {student.parent.user.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                              <Mail className="w-4 h-4 text-amber-500" />
                              {student.parent.user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-gray-500">No guardian linked.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Fee Ledger Snapshot */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400"><CreditCard className="w-5 h-5" /></div>
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Fee Ledger</h3>
                  </div>
                </div>
                
                <div className="p-6 flex-1 space-y-4 max-h-[500px] overflow-y-auto">
                  {feeStructures
                    .filter((s) => s.studentId === student.id || s.classId === student.classId)
                    .map((s) => {
                      const discountRecord = student.feeDiscounts?.find((d: any) => d.feeStructureId === s.id);
                      const discount = discountRecord ? discountRecord.amount : 0;
                      const effectiveAmount = s.amount - discount;
                      const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
                      const pending = Math.max(0, effectiveAmount - paidSoFar);
                      const progress = effectiveAmount > 0 ? Math.min(100, Math.round((paidSoFar / effectiveAmount) * 100)) : 100;
                      
                      return (
                        <div key={s.id} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{s.name}</span>
                              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                                <button onClick={() => { setDiscountFee(s); setDiscountAmount(effectiveAmount); setShowDiscountModal(true); }} className="text-gray-400 hover:text-indigo-600 transition-colors p-1"><Edit2 className="w-3 h-3" /></button>
                              )}
                            </div>
                            <div className="text-right">
                              {discount > 0 ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] line-through text-gray-400">₹{s.amount}</span>
                                  <span className="text-sm font-black text-indigo-600">₹{effectiveAmount}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-black text-indigo-600">₹{s.amount}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-blue-500'}`} style={{ width: `${progress}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-emerald-600">Paid: ₹{paidSoFar}</span>
                            <span className={pending > 0 ? 'text-rose-500' : 'text-gray-400'}>Pending: ₹{pending}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

          </div>

          {/* Full Width Transactions Table */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400"><ClipboardCheck className="w-5 h-5" /></div>
                Transaction History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 dark:bg-gray-800/40 text-[10px] uppercase tracking-widest text-gray-500 font-black border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Fee Structure</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Receipt No</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {student.feePayments?.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm font-bold text-gray-400">No payment records found.</td></tr>
                  ) : (
                    student.feePayments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">{p.feeStructure?.name}</td>
                        <td className="px-6 py-4 font-black text-emerald-600">₹{p.amountPaid}</td>
                        <td className="px-6 py-4 font-medium text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${p.method === 'UPI' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {p.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-400 truncate max-w-[120px]">{p.receiptNo || 'N/A'}</td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5">
                          <button onClick={() => handlePrintReceipt(p)} className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" title="Print Receipt">
                            <FileDown className="w-4 h-4" />
                          </button>
                          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                            <>
                              <button onClick={() => { setEditingPayment(p); setShowEditModal(true); }} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeletePayment(p.id)} className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      {/* ============================================================
             ================= PRINT-ONLY DOSSIER VIEW =================
             ============================================================ */}
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
        `}
      </style>
      <div className={`hidden ${printPayment ? '' : 'print:flex'} print:w-[210mm] print:h-[297mm] bg-white text-black font-sans relative flex-col mx-auto box-border overflow-hidden`} style={{ pageBreakAfter: 'always' }}>
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="w-[150mm] h-[150mm] rounded-full border-[20px] border-gray-900 flex items-center justify-center">
             <span className="text-9xl font-black tracking-tighter">JY</span>
          </div>
        </div>

        {/* Decorative Border */}
        <div className="absolute inset-[10mm] border-[4px] border-double border-gray-800 pointer-events-none opacity-90" />
        <div className="absolute inset-[11.5mm] border border-gray-400 pointer-events-none" />
        
        <div className="p-[20mm] h-full flex flex-col relative z-10 w-full">
          
          {/* Header */}
          <div className="text-center mb-8 border-b-[3px] border-gray-900 pb-6 relative">
            <h1 className="text-5xl font-black tracking-[0.2em] uppercase text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              JY SCHOOL
            </h1>
            <p className="text-[13px] font-bold uppercase tracking-widest text-gray-700">
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </p>
            <div className="mt-6 inline-flex px-12 py-2.5 bg-gray-900 rounded-sm">
              <span className="text-sm font-black uppercase tracking-[0.3em] text-white">
                Official Student Record
              </span>
            </div>
          </div>

          {/* Student ID block */}
          <div className="flex justify-between items-center mb-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div>
              <h2 className="text-4xl font-black text-gray-900 leading-none mb-4">{student.user.name}</h2>
              <div className="flex gap-6 text-sm font-bold text-gray-700 inline-flex">
                <span className="uppercase tracking-wider">Roll No: <span className="text-black font-black text-lg">{student.rollNo}</span></span>
                <span className="text-gray-400">•</span>
                <span className="uppercase tracking-wider">Class: <span className="text-black font-black text-lg">{student.class ? `${student.class.name} - ${student.class.section}` : 'N/A'}</span></span>
              </div>
            </div>
            
            <div className="w-36 h-44 border-4 border-white rounded-lg overflow-hidden flex-shrink-0 bg-white flex items-center justify-center shadow-md">
              <Avatar 
                src={getPhotoUrl(student.user.photoUrl)} 
                name={student.user.name} 
                size="lg" 
                variant="rectangular" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 flex-grow text-[13px]">
            <div className="space-y-7">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-2">Personal Details</h3>
              
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Gender</span>
                <span className="col-span-2 font-bold text-black text-right">{student.gender || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Date of Birth</span>
                <span className="col-span-2 font-bold text-black text-right">
                  {student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Blood Group</span>
                <span className="col-span-2 font-bold text-black text-right">{student.bloodGroup || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Admission</span>
                <span className="col-span-2 font-bold text-black text-right">
                  {new Date(student.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5 mt-8">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Aadhar No</span>
                <span className="col-span-2 font-bold text-black text-right">{student.aadharNo || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">PEN No</span>
                <span className="col-span-2 font-bold text-black text-right">{student.penNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-7">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-2">Family & Contact</h3>
              
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Father Name</span>
                <span className="col-span-2 font-bold text-black text-right">{student.fatherName || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Mother Name</span>
                <span className="col-span-2 font-bold text-black text-right">{student.motherName || 'N/A'}</span>
              </div>
              
              {student.parent && (
                <>
                  <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5 mt-4">
                    <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Guardian</span>
                    <span className="col-span-2 font-bold text-black text-right">{student.parent.user.name}</span>
                  </div>
                  <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                    <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Contact</span>
                    <span className="col-span-2 font-bold text-black text-right">{student.parent.user.phone || 'N/A'}</span>
                  </div>
                </>
              )}
              
              <div className="flex flex-col gap-1.5 pt-6">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Residential Address</span>
                <span className="text-sm font-bold text-black leading-relaxed p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[72px]">
                  {student.address || 'No address provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="mt-auto mb-6 flex justify-between items-end px-6">
            <div className="text-center w-56">
              <div className="h-0 border-b-2 border-gray-800 w-full mb-3"></div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Class Teacher
              </span>
            </div>
            
            <div className="w-32 h-32 rounded-full border-[3px] border-double border-gray-300 flex items-center justify-center bg-gray-50 -my-4 relative z-0" />

            <div className="text-center w-56">
              <div className="h-0 border-b-2 border-gray-800 w-full mb-3"></div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Principal / Registrar
              </span>
            </div>
          </div>

          {/* System generated stamp */}
          <div className="text-center pt-4 border-t border-gray-300">
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                System Generated • Date: {new Date().toLocaleDateString('en-IN')} • JY SCHOOL Student Database
             </span>
          </div>

        </div>
      </div>

    </div>

      {/* Record Payment Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden">
          <div className="fixed inset-0" onClick={() => setShowModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Record Tuition Payment</h3>
              <p className="text-xs text-gray-450 mt-1">Collecting for {student.user.name}</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="label mb-2">Select Fee Components & Amount</label>
                <div className="space-y-2 border border-gray-200 dark:border-gray-800 rounded-xl p-3 bg-gray-50 dark:bg-gray-800/20 max-h-48 overflow-y-auto">
                  {(() => {
                    const availableStructures = feeStructures.filter((s) => s.studentId === student.id || s.classId === student.classId);
                    const allPaid = availableStructures.every(s => {
                      const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
                      return Math.max(0, s.amount - paidSoFar) <= 0;
                    });

                    return (
                      <>
                        {availableStructures.map((s) => {
                          const paidSoFar = student.feePayments?.filter((p: any) => p.feeStructureId === s.id).reduce((sum: number, p: any) => sum + p.amountPaid, 0) || 0;
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

              <div>
                <label className="label">Payment Date</label>
                <input 
                  type="date" 
                  value={paymentDate} 
                  onChange={(e) => setPaymentDate(e.target.value)} 
                  className="input text-xs" 
                  required
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

              {method === 'UPI' && (
                <div className="space-y-4 border-l-2 border-primary-500 pl-3.5 my-2">
                  <div>
                    <label className="label">UPI UTR Reference Number</label>
                    <input
                      type="text"
                      required
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="input text-xs"
                    />
                  </div>
                  <div>
                    <label className="label">Upload Payment Receipt (Optional)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">Record Payment</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Payment Modal */}
      {showEditModal && editingPayment && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden">
          <div className="fixed inset-0" onClick={() => setShowEditModal(false)} />
          <div className="relative card w-full max-w-md p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Payment</h3>
              <p className="text-xs text-gray-450 mt-1">Editing receipt: {editingPayment.receiptNo || 'N/A'}</p>
            </div>

            <form onSubmit={handleEditPaymentSubmit} className="space-y-4">
              <div>
                <label className="label">Amount Paid</label>
                <input
                  type="number"
                  required
                  value={editingPayment.amountPaid}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amountPaid: Number(e.target.value) })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Payment Method</label>
                <select 
                  value={editingPayment.method} 
                  onChange={(e) => setEditingPayment({ ...editingPayment, method: e.target.value })} 
                  className="input text-xs"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online Transfer</option>
                  <option value="BANK_TRANSFER">Bank Deposit</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI / QR Code</option>
                </select>
              </div>

              <div>
                <label className="label">Remarks</label>
                <input
                  type="text"
                  value={editingPayment.remarks || ''}
                  onChange={(e) => setEditingPayment({ ...editingPayment, remarks: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">Update Payment</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Discount Fee Modal */}
      {showDiscountModal && discountFee && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-xs print:hidden">
          <div className="fixed inset-0" onClick={() => setShowDiscountModal(false)} />
          <div className="relative card w-full max-w-sm p-6 space-y-5 animate-scale-in z-10 bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Fee Amount</h3>
              <p className="text-xs text-gray-450 mt-1">Applying discount for {discountFee.name}</p>
            </div>

            <form onSubmit={handleApplyDiscount} className="space-y-4">
              <div className="flex justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg text-sm mb-4">
                <span className="text-gray-500">Original Fee:</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{discountFee.amount}</span>
              </div>

              <div>
                <label className="label">New Fee Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  max={discountFee.amount}
                  required
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="input text-xs"
                />
                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                  Original fee was: <strong className="text-gray-600">₹{discountFee.amount}</strong>. 
                  (Discount applied: ₹{Math.max(0, discountFee.amount - discountAmount)})
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowDiscountModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">Save Fee</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden Print Component */}
      <FeeReceiptPrint payment={printPayment} />
    </>
  );
};

export default StudentProfilePage;
