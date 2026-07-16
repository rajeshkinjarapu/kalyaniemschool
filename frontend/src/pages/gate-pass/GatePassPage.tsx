import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { FileText, CheckCircle2, XCircle, PlusCircle, Printer } from 'lucide-react';

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

  const printSlip = (item: GatePassItem) => {
    // Show in-app preview modal
    setSelected(item);
    setPreviewOpen(true);
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const previewRef = React.useRef<HTMLDivElement | null>(null);

  const downloadPdf = async (id: string) => {
    try {
      setPdfLoading(true);
      const response = await api.get(`/api/gate-pass/${id}/print/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gatepass-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF download failed', err);
      const msg = err?.response?.data?.message || err?.message || 'PDF download failed';
      toast.error(msg);
    } finally {
      setPdfLoading(false);
    }
  };

  const printPreview = (id: string) => {
    try {
      // If preview content ref exists, render it into a new window and call print
      const content = previewRef.current;
      if (!content) {
        toast.error('Preview not available');
        return;
      }

      const printWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (!printWindow) {
        toast.error('Popup blocked. Allow popups for this site to print.');
        return;
      }

      const doc = printWindow.document;
      doc.open();
      doc.write(`<!doctype html><html><head><title>Gate Pass</title><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><style>body{font-family:Arial,Helvetica,sans-serif;color:#222} .container{max-width:800px;margin:20px auto;padding:16px} .header{text-align:center}.photo{width:120px;height:140px;object-fit:cover;border:1px solid #ddd}</style></head><body>`);
      doc.write(content.innerHTML);
      doc.write('</body></html>');
      doc.close();
      printWindow.focus();
      // Wait a bit for images/styles to load
      setTimeout(() => {
        printWindow.print();
      }, 300);
    } catch (e) {
      console.error('Print preview failed', e);
      toast.error('Print failed');
    }
  };

  const roleLabel = useMemo(() => {
    if (user?.role === 'STUDENT') return 'Student';
    if (user?.role === 'TEACHER') return 'Teacher';
    return 'Admin';
  }, [user?.role]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600"><FileText className="h-5 w-5" /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Gate Pass {roleLabel}</h2>
            <p className="text-sm text-slate-500">Request a short leave or exit pass and approve requests from the admin side.</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold"><PlusCircle className="h-4 w-4" /> {canApprove ? 'Issue Gate Pass to Student' : 'New Request'}</div>
        <div className="grid gap-4 md:grid-cols-2">
          {canApprove && (
            <select className="rounded-xl border border-slate-200 p-3" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.user?.name || 'Unknown student'}{student.rollNo ? ` (${student.rollNo})` : ''}
                </option>
              ))}
            </select>
          )}
          <input className="rounded-xl border border-slate-200 p-3" placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <input className="rounded-xl border border-slate-200 p-3" placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <input className="rounded-xl border border-slate-200 p-3" placeholder="Exit time" value={form.exitTime} onChange={(e) => setForm({ ...form, exitTime: e.target.value })} />
          <input className="rounded-xl border border-slate-200 p-3" placeholder="Return time" value={form.returnTime} onChange={(e) => setForm({ ...form, returnTime: e.target.value })} />
        </div>
        <textarea className="w-full rounded-xl border border-slate-200 p-3" placeholder="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold" type="submit">{canApprove ? 'Issue Gate Pass' : 'Submit Request'}</button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Recent Requests</h3>
          <span className="text-sm text-slate-500">{loading ? 'Loading...' : `${items.length} total`}</span>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{item.reason}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-600">{item.status}</span>
                  </div>
                  <p className="text-sm text-slate-500">Requested by {item.requester?.name} · {item.requestType}</p>
                  {item.student?.user?.name && <p className="text-sm text-slate-500">Student: {item.student.user.name}</p>}
                  {item.destination && <p className="text-sm text-slate-500">Destination: {item.destination}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {canApprove && item.status === 'PENDING' && (
                    <>
                      <button onClick={() => approve(item.id, 'APPROVED')} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white">Approve</button>
                      <button onClick={() => approve(item.id, 'REJECTED')} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white">Reject</button>
                    </>
                  )}
                  {item.status === 'APPROVED' && (
                    <button onClick={() => printSlip(item)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                      <span className="flex items-center gap-2"><Printer className="h-4 w-4" /> Print Slip</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && previewOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6">
          <div className="max-w-3xl w-full rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gate Pass Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadPdf(selected.id)} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">{pdfLoading ? 'Downloading...' : 'Download PDF'}</button>
                <button onClick={() => printPreview(selected.id)} className="rounded-md border px-3 py-2 text-sm">Print</button>
                <button onClick={() => window.open(`/api/gate-pass/${selected.id}/print`, '_blank')} className="rounded-md border px-3 py-2 text-sm">Open Print</button>
                <button onClick={() => setPreviewOpen(false)} className="rounded-md border px-3 py-2 text-sm">Close</button>
              </div>
            </div>
            <div className="mx-auto mt-4 rounded-2xl border border-slate-300 p-6" ref={previewRef}>
              <div className="text-center">
                <h2 className="text-2xl font-black uppercase">{schoolName.toUpperCase()}</h2>
                <p className="text-sm text-slate-600">Gate Pass Slip</p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_180px]">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Slip Number</p>
                    <p className="font-semibold">{selected.slipNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="font-semibold">{selected.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Student</p>
                    <p className="font-semibold">{selected.student?.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Class / Roll</p>
                    <p className="font-semibold">{selected.student?.class ? `${selected.student.class.name} ${selected.student.class.section}` : 'N/A'}{selected.student?.rollNo ? ` · ${selected.student.rollNo}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Requested By</p>
                    <p className="font-semibold">{selected.requester?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Destination</p>
                    <p className="font-semibold">{selected.destination || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Reason</p>
                    <p className="font-semibold">{selected.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Timing</p>
                    <p className="font-semibold">{selected.exitTime || 'N/A'} - {selected.returnTime || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 p-3">
                  {selected.student?.user?.photoUrl ? (
                    <img src={selected.student.user.photoUrl} alt="Student Photo" className="h-36 w-28 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-36 w-28 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">No Photo</div>
                  )}
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{selected.notes || 'No additional notes.'}</div>
              <div className="mt-8 flex items-center justify-between border-t pt-4 text-sm text-slate-600">
                <div>Approved By: {selected.approvedBy?.name || 'Pending'}</div>
                <div>Date: {new Date(selected.requestedDate).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatePassPage;
