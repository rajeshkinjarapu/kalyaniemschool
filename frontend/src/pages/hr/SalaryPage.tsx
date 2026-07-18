import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import {
  CreditCard, Shield, Plus, DollarSign, Calendar,
  Download, Eye, Edit3, Trash2, CheckCircle2, AlertCircle, X
} from 'lucide-react';

interface SalaryRecord {
  id: string;
  teacherId: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidOn: string | null;
  remarks: string | null;
  teacher: { user: { name: string; email: string; photoUrl?: string } };
}

interface Teacher {
  id: string;
  employeeId: string;
  user: { name: string };
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SalaryPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form State
  const [form, setForm] = useState({
    teacherId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    basicSalary: '', allowances: '0', deductions: '0', remarks: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState('');

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params: any = { year: filterYear };
      if (filterMonth) params.month = filterMonth;
      const res: any = await api.get('/api/salary', { params });
      setSalaries(res.data?.data || []);
    } catch {
      setError('Failed to load salaries');
    } finally { setLoading(false); }
  };

  const fetchTeachers = async () => {
    try {
      const res: any = await api.get('/api/teachers', { params: { limit: 200 } });
      setTeachers(res.data?.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchSalaries();
    if (isAdmin && teachers.length === 0) fetchTeachers();
  }, [filterYear, filterMonth]);

  const openCreate = () => {
    setEditId(null);
    setForm({
      teacherId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
      basicSalary: '', allowances: '0', deductions: '0', remarks: ''
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.teacherId || !form.basicSalary) {
      setError('Teacher and Basic Salary are required'); return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await api.put(`/api/salary/${editId}`, form);
      } else {
        await api.post('/api/salary', form);
      }
      setShowForm(false);
      fetchSalaries();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save salary record');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this salary record?')) return;
    try {
      await api.delete(`/api/salary/${id}`);
      setSalaries(s => s.filter(x => x.id !== id));
    } catch {}
  };

  const handleMarkPaid = async (id: string) => {
    if (!window.confirm('Mark this salary as PAID?')) return;
    try {
      await api.patch(`/api/salary/${id}/mark-paid`);
      fetchSalaries();
    } catch {}
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[70vh]" />;

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-0 sm:p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen animate-fade-in-up pb-10 overflow-x-hidden">
      {/* Header */}
      <div className="relative overflow-hidden rounded-none sm:rounded-[2rem]" style={{
        background: 'linear-gradient(120deg, #0f172a 0%, #1e1b4b 50%, #7c3aed 100%)',
        boxShadow: '0 25px 50px -12px rgba(124,58,237,0.3)',
      }}>
        <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full opacity-30 animate-pulse"
          style={{ background: 'radial-gradient(circle, #c4b5fd 0%, transparent 70%)' }} />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
              {isAdmin ? <Shield className="w-7 h-7 text-violet-300" /> : <CreditCard className="w-7 h-7 text-violet-300" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isAdmin ? 'HR & Payroll' : 'My Salary Slips'}
              </h1>
              <p className="text-violet-200/80 text-sm font-medium mt-0.5">
                {isAdmin ? 'Manage staff salaries and generate payslips' : 'View your monthly salary and payment history'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Plus className="w-4 h-4" /> Add Record
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 px-3 sm:px-0">
        <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer">
          {[0,1,2,3,4].map(y => {
            const yr = new Date().getFullYear() - y;
            return <option key={yr} value={yr}>{yr}</option>;
          })}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer">
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
      </div>

      {/* Salary List */}
      <div className="px-3 sm:px-0">
        {salaries.length === 0 ? (
        <div className="text-center py-20 rounded-[2rem] bg-white border border-slate-100"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
          <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-500">No salary records</h3>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin ? 'No records found for the selected period.' : 'No salary slips available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {salaries.map(sal => {
            const isPaid = sal.status === 'PAID';
            return (
              <div key={sal.id} className="bg-white rounded-[1.5rem] border border-slate-100 p-5 transition-all hover:shadow-xl"
                style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-violet-600 font-bold bg-violet-50">
                      {MONTHS[sal.month - 1]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {MONTHS[sal.month - 1]} {sal.year}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">Payslip</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {sal.status}
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 mb-4">
                    {sal.teacher.user.photoUrl ? (
                      <img src={sal.teacher.user.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-black">
                        {sal.teacher.user.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-600 truncate">{sal.teacher.user.name}</span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Basic Salary</span>
                    <span>₹{sal.basicSalary.toLocaleString()}</span>
                  </div>
                  {(sal.allowances > 0 || sal.deductions > 0) && (
                    <>
                      <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Allowances</span>
                        <span className="text-green-600">+₹{sal.allowances.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Deductions</span>
                        <span className="text-red-600">-₹{sal.deductions.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-800 pt-2 border-t border-slate-50">
                    <span>Net Salary</span>
                    <span className="text-violet-600">₹{sal.netSalary.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  {isAdmin && !isPaid && (
                    <button onClick={() => handleMarkPaid(sal.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                      Mark Paid
                    </button>
                  )}
                  {isAdmin && (
                    <div className="flex gap-1 ml-auto">
                      <button onClick={() => handleDelete(sal.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {!isAdmin && (
                    <button className="flex-1 flex justify-center items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Download Slip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Admin Create Form */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800">Add Salary Record</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Teacher *</label>
                <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none">
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Month *</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none">
                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Year *</label>
                  <input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Basic Salary (₹) *</label>
                <input type="number" value={form.basicSalary} onChange={e => setForm(f => ({ ...f, basicSalary: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Allowances (₹)</label>
                  <input type="number" value={form.allowances} onChange={e => setForm(f => ({ ...f, allowances: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase block mb-1.5">Deductions (₹)</label>
                  <input type="number" value={form.deductions} onChange={e => setForm(f => ({ ...f, deductions: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-violet-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryPage;
