import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { FileText, CheckCircle2, XCircle, PlusCircle, Printer } from 'lucide-react';
import { GatePassPrint } from '../../components/gate-pass/GatePassPrint';

interface GatePassItem {
  id: string;
  reason: string;
  destination?: string;
  exitTime?: string;
  returnTime?: string;
  notes?: string;
  requestType: string;
  status: string;
  slipNumber?: string;
  requestedDate: string;
  requester: { name: string; role: string };
  student?: { rollNo?: string; user?: { name: string; photoUrl?: string }; class?: { name: string; section: string } };
  approvedBy?: { name: string };
  rejectionReason?: string;
}

interface StudentOption {
  id: string;
  rollNo?: string;
  user?: { name: string };
}

const GatePassPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<GatePassItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('JY SCHOOL');
  const [form, setForm] = useState({ reason: '', destination: '', exitTime: '', returnTime: '', notes: '', studentId: '', requestType: user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT' });
  const [selected, setSelected] = useState<GatePassItem | null>(null);
  
  // Added missing states for print preview & pdf
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const downloadPdf = (id: string) => { toast.error('PDF download not implemented yet'); };

  const canApprove = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/gate-pass');
      setItems(res.data || []);
    } catch {
      toast.error('Unable to load gate passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/api/settings').then((response: any) => {
      if (response?.data?.schoolName) setSchoolName(response.data.schoolName);
    }).catch(() => {});

    if (canApprove) {
      api.get('/api/students?limit=100').then((response: any) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        setStudents(list);
      }).catch(() => {});
    }
  }, [canApprove]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (canApprove && !form.studentId) {
      toast.error('Please select a student before issuing a gate pass');
      return;
    }

    try {
      await api.post('/api/gate-pass', { ...form, studentId: form.studentId || undefined });
      toast.success(canApprove ? 'Gate pass issued to student' : 'Gate pass requested');
      setForm({ reason: '', destination: '', exitTime: '', returnTime: '', notes: '', studentId: '', requestType: user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to submit request');
    }
  };

  const approve = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/api/gate-pass/${id}`, { status, rejectionReason: status === 'REJECTED' ? 'Not approved' : undefined });
      toast.success(`Gate pass ${status.toLowerCase()}`);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const [printGatePass, setPrintGatePass] = useState<any>(null);

  const printSlip = (item: GatePassItem) => {
    setPrintGatePass(item);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const printPreview = (id: string) => {
    const item = items.find(p => p.id === id);
    if (item) printSlip(item);
  };

  const printModal = () => {
    try {
      const content = previewRef.current;
      if (!content) {
        toast.error('Preview not available');
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        toast.error('Unable to create print frame');
        document.body.removeChild(iframe);
        return;
      }

      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Gate Pass</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#222;padding:16px} .photo{width:120px;height:140px;object-fit:cover;border:1px solid #ddd}</style></head><body>${content.innerHTML}</body></html>`);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('iframe print failed', e);
          toast.error('Print failed');
        }
        setTimeout(() => document.body.removeChild(iframe), 500);
      }, 300);
    } catch (e) {
      console.error('printModal error', e);
      toast.error('Print failed');
    }
  };

  const roleLabel = useMemo(() => {
    if (user?.role === 'STUDENT') return 'Student';
    if (user?.role === 'TEACHER') return 'Teacher';
    return 'Admin';
  }, [user?.role]);

  return (
    <div className="space-y-8 p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="print:hidden space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 shadow-xl text-white transform transition-all hover:scale-[1.01]">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-md">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Gate Pass {roleLabel}</h2>
            <p className="text-indigo-100 mt-1 font-medium text-lg opacity-90">Request a short leave or exit pass and manage requests dynamically.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-3xl border border-white/50 bg-white/80 backdrop-blur-lg p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 text-indigo-700 font-bold text-xl border-b border-indigo-100 pb-4">
          <PlusCircle className="h-6 w-6" /> {canApprove ? 'Issue Gate Pass to Student' : 'New Request'}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {canApprove && (
            <select className="rounded-2xl border-2 border-indigo-100 bg-white p-4 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 outline-none" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.user?.name || 'Unknown student'}{student.rollNo ? ` (${student.rollNo})` : ''}
                </option>
              ))}
            </select>
          )}
          <input className="rounded-2xl border-2 border-indigo-100 bg-white p-4 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 outline-none placeholder:text-slate-400" placeholder="Reason (e.g. Doctor appointment)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <input className="rounded-2xl border-2 border-indigo-100 bg-white p-4 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 outline-none placeholder:text-slate-400" placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <input className="rounded-2xl border-2 border-indigo-100 bg-white p-4 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 outline-none placeholder:text-slate-400" placeholder="Exit time (e.g. 10:30 AM)" value={form.exitTime} onChange={(e) => setForm({ ...form, exitTime: e.target.value })} />
          <input className="rounded-2xl border-2 border-indigo-100 bg-white p-4 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 outline-none placeholder:text-slate-400" placeholder="Return time (e.g. 12:00 PM)" value={form.returnTime} onChange={(e) => setForm({ ...form, returnTime: e.target.value })} />
        </div>
        <textarea className="w-full rounded-2xl border-2 border-indigo-100 bg-white p-4 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-slate-700 outline-none placeholder:text-slate-400 resize-none" placeholder="Additional Notes..." rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="w-full md:w-auto rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-white font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-105 transition-all active:scale-95" type="submit">
          {canApprove ? 'Issue Gate Pass' : 'Submit Request'}
        </button>
      </form>

      <div className="rounded-3xl border border-white/50 bg-white/80 backdrop-blur-lg p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-indigo-100 pb-4">
          <h3 className="text-2xl font-extrabold text-indigo-900">Recent Requests</h3>
          <span className="rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-bold text-indigo-700 shadow-sm">{loading ? 'Loading...' : `${items.length} total`}</span>
        </div>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="group rounded-2xl border-2 border-slate-100 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-slate-800">{item.reason}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span> Requested by <span className="font-semibold text-slate-700">{item.requester?.name}</span> · {item.requestType}
                    </p>
                    {item.student?.user?.name && <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span> Student: <span className="font-semibold text-slate-700">{item.student.user.name}</span></p>}
                    {item.destination && <p className="text-sm font-medium text-slate-500 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-pink-400"></span> Destination: <span className="font-semibold text-slate-700">{item.destination}</span></p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {canApprove && item.status === 'PENDING' && (
                    <>
                      <button onClick={() => approve(item.id, 'APPROVED')} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-green-100 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </button>
                      <button onClick={() => approve(item.id, 'REJECTED')} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-400 to-rose-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-red-100 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                  {item.status === 'APPROVED' && (
                    <button onClick={() => printSlip(item)} className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm">
                      <Printer className="h-4 w-4" /> Print Slip
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="rounded-2xl border-2 border-dashed border-indigo-100 bg-indigo-50/50 p-12 text-center">
              <p className="text-lg font-semibold text-indigo-400">No gate pass requests found.</p>
            </div>
          )}
        </div>
      </div>

      {selected && previewOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="max-w-3xl w-full rounded-3xl bg-white p-8 shadow-2xl mt-10">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-2xl font-black text-slate-800">Gate Pass Preview</h3>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => downloadPdf(selected.id)} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all">{pdfLoading ? 'Downloading...' : 'Download PDF'}</button>
                <button onClick={() => printPreview(selected.id)} className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all">Print</button>
                <button onClick={() => setPreviewOpen(false)} className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">Close</button>
              </div>
            </div>
            {/* The rest of the preview is mostly for print, keep it simple but clean */}
            <div className="mx-auto mt-6 rounded-2xl border-2 border-slate-200 p-8" ref={previewRef}>
              <div className="text-center mb-8 border-b-2 border-dashed border-slate-200 pb-6">
                <h2 className="text-3xl font-black uppercase text-indigo-900 tracking-wider">{schoolName.toUpperCase()}</h2>
                <p className="text-lg font-bold text-slate-500 mt-2 tracking-widest uppercase">Gate Pass Slip</p>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-[1fr_180px]">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Slip Number</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selected.slipNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</p>
                    <p className="text-lg font-black text-slate-800 mt-1">{selected.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selected.student?.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Class / Roll</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selected.student?.class ? `${selected.student.class.name} ${selected.student.class.section}` : 'N/A'}{selected.student?.rollNo ? ` · ${selected.student.rollNo}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Requested By</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selected.requester?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Destination</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selected.destination || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reason</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{selected.reason}</p>
                  </div>
                  <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Timing</p>
                    <p className="text-xl font-black text-indigo-900 mt-1">{selected.exitTime || 'N/A'} <span className="text-slate-400 font-medium">to</span> {selected.returnTime || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start justify-center">
                  <div className="rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-slate-100">
                    {selected.student?.user?.photoUrl ? (
                      <img src={selected.student.user.photoUrl} alt="Student" className="h-44 w-32 object-cover" />
                    ) : (
                      <div className="flex h-44 w-32 flex-col items-center justify-center text-slate-400 gap-2">
                        <FileText className="h-8 w-8 opacity-50" />
                        <span className="text-xs font-bold">NO PHOTO</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-8 rounded-2xl bg-amber-50 border border-amber-200 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Notes / Remarks</p>
                <p className="text-amber-900 font-medium">{selected.notes || 'No additional notes.'}</p>
              </div>
              <div className="mt-10 flex items-center justify-between border-t-2 border-slate-100 pt-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Approved By</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{selected.approvedBy?.name || 'Pending'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{new Date(selected.requestedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* Hidden Print Component */}
      <GatePassPrint gatePass={printGatePass} />
    </div>
  );
};

export default GatePassPage;

