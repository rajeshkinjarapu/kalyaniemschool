import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';

export const LeaveRequestLogPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [formApplicant, setFormApplicant] = useState('');
  const [formTypeId, setFormTypeId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formReason, setFormReason] = useState('');

  useEffect(() => {
    // Load types
    const storedTypes = localStorage.getItem('fin_leave_types');
    const types = storedTypes ? JSON.parse(storedTypes) : [
      { id: '1', name: 'Sick Leave' },
      { id: '2', name: 'Casual Leave' },
      { id: '3', name: 'Earned Leave' }
    ];
    setLeaveTypes(types);
    if (types.length > 0) setFormTypeId(types[0].id);

    // Load requests
    const storedReqs = localStorage.getItem('fin_leave_requests');
    if (!storedReqs) {
      const defaultRequests = [
        { id: '1', applicant: 'Rajesh Kumar (Maths Teacher)', typeName: 'Sick Leave', startDate: '2026-07-06', endDate: '2026-07-08', reason: 'Fever and cold', status: 'Approved' },
        { id: '2', applicant: 'Srinivas Rao (Office Assistant)', typeName: 'Casual Leave', startDate: '2026-07-10', endDate: '2026-07-11', reason: 'Personal work', status: 'Pending' },
      ];
      localStorage.setItem('fin_leave_requests', JSON.stringify(defaultRequests));
      setRequests(defaultRequests);
    } else {
      setRequests(JSON.parse(storedReqs));
    }

    // Fetch teachers list
    api.get('/api/teachers')
      .then((res: any) => {
        const list = res.data.data || res.data || [];
        setTeachers(list);
        if (list.length > 0) {
          setFormApplicant(list[0].user.name);
        }
      })
      .catch(console.error);
  }, []);

  const saveRequests = (updated: any[]) => {
    setRequests(updated);
    localStorage.setItem('fin_leave_requests', JSON.stringify(updated));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if ((isAdmin && !formApplicant.trim()) || !formStartDate || !formEndDate || !formReason.trim()) {
      toast.error('All fields are required.');
      return;
    }

    const type = leaveTypes.find(t => t.id === formTypeId);

    const newReq = {
      id: Date.now().toString(),
      applicant: isAdmin ? formApplicant.trim() : user?.name || 'Unknown',
      typeName: type ? type.name : 'General Leave',
      startDate: formStartDate,
      endDate: formEndDate,
      reason: formReason.trim(),
      status: 'Pending'
    };

    saveRequests([...requests, newReq]);
    toast.success('Leave request submitted!');
    setShowModal(false);
    setFormApplicant(teachers.length > 0 ? teachers[0].user.name : '');
    setFormReason('');
    setFormStartDate('');
    setFormEndDate('');
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const updated = requests.map(r => r.id === id ? { ...r, status: newStatus } : r);
    saveRequests(updated);
    toast.success(`Leave request ${newStatus.toLowerCase()} successfully.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this leave record?')) {
      const updated = requests.filter(r => r.id !== id);
      saveRequests(updated);
      toast.success('Leave record deleted.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-xl font-black text-gray-900 dark:text-white">Leave Request Log</h3>
        <p className="text-xs text-indigo-500 font-semibold mt-0.5">Home / Leave Request Log</p>
      </div>

      {/* Main card wrapper */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-extrabold text-gray-955 dark:text-white">
            Leave Requests
          </h4>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/15 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Request Leave
          </button>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-455 border-b border-gray-150 dark:border-gray-800 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="pb-3">Applicant</th>
                <th className="pb-3">Leave Type</th>
                <th className="pb-3">Start Date</th>
                <th className="pb-3">End Date</th>
                <th className="pb-3">Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">{isAdmin && 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(isAdmin ? requests : requests.filter(r => r.applicant === user?.name)).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-855/10 transition-colors">
                  <td className="py-4 font-bold text-gray-900 dark:text-white">{r.applicant}</td>
                  <td className="py-4 text-gray-600 dark:text-gray-300 font-semibold">{r.typeName}</td>
                  <td className="py-4 text-xs text-gray-500 font-semibold">{r.startDate}</td>
                  <td className="py-4 text-xs text-gray-500 font-semibold">{r.endDate}</td>
                  <td className="py-4 text-xs text-gray-400 font-medium max-w-[200px] truncate" title={r.reason}>
                    {r.reason}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      r.status === 'Approved'
                        ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400'
                        : r.status === 'Rejected'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'
                    }`}>
                      {r.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                      {r.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                      {r.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 text-right flex justify-end gap-2">
                    {isAdmin && r.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'Approved')}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'Rejected')}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-750 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-red-50 text-indigo-650 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(isAdmin ? requests : requests.filter(r => r.applicant === user?.name)).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No leave requests logged.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Request Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xl max-w-md w-full space-y-4 animate-scale-in">
            <h4 className="text-base font-extrabold text-gray-900 dark:text-white border-b pb-2 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              Request Leave
            </h4>
            <form onSubmit={handleCreate} className="space-y-4">
              {isAdmin && (
                <div className="space-y-1">
                  <label className="label text-xs uppercase font-extrabold text-gray-400">Applicant Name (Teacher)</label>
                  <select
                    className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                    value={formApplicant}
                    onChange={e => setFormApplicant(e.target.value)}
                    required={isAdmin}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.user.name}>
                        {t.user.name} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Leave Type</label>
                <select
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  value={formTypeId}
                  onChange={e => setFormTypeId(e.target.value)}
                  required
                >
                  {leaveTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="label text-xs uppercase font-extrabold text-gray-400">Start Date</label>
                  <input
                    type="date"
                    className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="label text-xs uppercase font-extrabold text-gray-400">End Date</label>
                  <input
                    type="date"
                    className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="label text-xs uppercase font-extrabold text-gray-400">Reason</label>
                <textarea
                  className="input w-full bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                  rows={3}
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  placeholder="Enter Reason"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestLogPage;
