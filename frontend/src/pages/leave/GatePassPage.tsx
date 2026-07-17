import React, { useEffect, useState } from 'react';
import { Plus, Calendar, MapPin, Clock, CheckCircle2, ShieldCheck, ArrowRight, Users, FileText } from 'lucide-react';

interface GatePassRequest {
  id: string;
  student: string;
  standard: string;
  destination: string;
  reason: string;
  exitTime: string;
  returnTime: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const students = [
  { id: 'S-0101', name: 'Aditya Sharma', standard: '10-A' },
  { id: 'S-0102', name: 'Priya Reddy', standard: '9-B' },
  { id: 'S-0103', name: 'Kavya Singh', standard: '11-C' },
  { id: 'S-0104', name: 'Rohit Mehta', standard: '8-D' },
];

export const GatePassPage: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState(students[0].id);
  const [destination, setDestination] = useState('Library');
  const [reason, setReason] = useState('Medical appointment');
  const [exitTime, setExitTime] = useState('14:30');
  const [returnTime, setReturnTime] = useState('15:30');
  const [requests, setRequests] = useState<GatePassRequest[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('jy_gatepass_requests');
    if (saved) {
      setRequests(JSON.parse(saved));
      return;
    }
    const defaultRequests: GatePassRequest[] = [
      {
        id: '1', student: 'Aditya Sharma', standard: '10-A', destination: 'Clinic', reason: 'Medical check-up',
        exitTime: '11:00 AM', returnTime: '11:40 AM', status: 'Approved',
      },
      {
        id: '2', student: 'Priya Reddy', standard: '9-B', destination: 'Bus Stop', reason: 'Family pickup',
        exitTime: '03:20 PM', returnTime: '03:40 PM', status: 'Pending',
      },
      {
        id: '3', student: 'Kavya Singh', standard: '11-C', destination: 'Office', reason: 'Document submission',
        exitTime: '12:10 PM', returnTime: '12:45 PM', status: 'Rejected',
      },
    ];
    setRequests(defaultRequests);
  }, []);

  useEffect(() => {
    localStorage.setItem('jy_gatepass_requests', JSON.stringify(requests));
  }, [requests]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const student = students.find((item) => item.id === selectedStudent);
    if (!student) return;

    const newRequest: GatePassRequest = {
      id: Date.now().toString(),
      student: student.name,
      standard: student.standard,
      destination,
      reason,
      exitTime: `${exitTime}`,
      returnTime: `${returnTime}`,
      status: 'Pending',
    };

    setRequests([newRequest, ...requests]);
    setReason('');
    setDestination('Library');
    setExitTime('14:30');
    setReturnTime('15:30');
  };

  const counts = {
    pending: requests.filter((r) => r.status === 'Pending').length,
    approved: requests.filter((r) => r.status === 'Approved').length,
    rejected: requests.filter((r) => r.status === 'Rejected').length,
    total: requests.length,
  };

  const statusStyle = (status: GatePassRequest['status']) => {
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700';
    if (status === 'Rejected') return 'bg-red-50 text-red-700';
    return 'bg-amber-50 text-amber-700';
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] overflow-hidden bg-gradient-to-r from-indigo-950 via-violet-900 to-fuchsia-800 shadow-[0_24px_80px_-32px_rgba(124,58,237,0.85)] border border-white/10 p-6 md:p-8 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.26),transparent_30%)]" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-4 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100 shadow-sm backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              Gate Pass Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Colorful Gate Pass Control</h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-200/90 leading-7">
              Issue quick gate passes, track student exits, and monitor approval flow with a vibrant school dashboard tailored for JY School.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white/10 border border-white/15 p-4 shadow-[0_18px_50px_-30px_rgba(255,255,255,0.7)]">
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-200/70">Active Requests</p>
                <p className="text-3xl font-black mt-3">{counts.total}</p>
              </div>
              <div className="rounded-3xl bg-white/10 border border-white/15 p-4 shadow-[0_18px_50px_-30px_rgba(255,255,255,0.7)]">
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-200/70">Pending Approval</p>
                <p className="text-3xl font-black mt-3">{counts.pending}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/10 border border-white/15 p-6 backdrop-blur-xl shadow-[0_22px_60px_-30px_rgba(255,255,255,0.55)]">
            <div className="flex items-center gap-3 text-white mb-4">
              <div className="w-14 h-14 rounded-3xl bg-white/10 grid place-items-center text-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-200/80">Ready to issue</p>
                <p className="text-lg font-black">Fresh workflows for leave-out passes</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-3xl bg-white/10 p-3">
                <p className="text-2xl font-black text-white">{counts.approved}</p>
                <p className="text-[10px] uppercase text-slate-200/70 tracking-[0.25em]">Approved</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-3">
                <p className="text-2xl font-black text-white">{counts.rejected}</p>
                <p className="text-[10px] uppercase text-slate-200/70 tracking-[0.25em]">Rejected</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-3">
                <p className="text-2xl font-black text-white">{requests.length ? Math.round((counts.approved / requests.length) * 100) : 0}%</p>
                <p className="text-[10px] uppercase text-slate-200/70 tracking-[0.25em]">Approval Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] bg-white shadow-lg border border-slate-200/80 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.27em] text-slate-500">Issue Gate Pass</p>
              <h2 className="text-2xl font-black text-slate-900 mt-2">New Request Form</h2>
            </div>
            <div className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> New passage creation
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="block"> 
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Student</span>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-indigo-300"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} • {student.standard}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Destination</span>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. School gate, Clinic, Bus stop"
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-indigo-300"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-5">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Reason</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Brief reason for leaving"
                  rows={4}
                  className="mt-2 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-indigo-300 resize-none"
                />
              </label>
              <div className="grid gap-5">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Exit time</span>
                  <input
                    type="time"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-indigo-300"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Return time</span>
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-indigo-300"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-500 px-6 py-3 text-sm font-black text-white shadow-[0_16px_32px_-16px_rgba(99,102,241,0.75)] transition hover:-translate-y-0.5"
            >
              <Clock className="w-4 h-4" /> Issue Gate Pass
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] bg-gradient-to-br from-sky-50 via-white to-rose-50 border border-slate-200 shadow-lg p-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quick stats</p>
                <h3 className="text-2xl font-black text-slate-900">Request Highlights</h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-fuchsia-700 shadow-sm">
                <ArrowRight className="w-4 h-4" /> Live update
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Pending', value: counts.pending, color: 'from-amber-300 to-amber-500', icon: Clock },
                { label: 'Approved', value: counts.approved, color: 'from-emerald-300 to-emerald-500', icon: CheckCircle2 },
                { label: 'Rejected', value: counts.rejected, color: 'from-rose-300 to-rose-500', icon: ShieldCheck },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] p-4 bg-white shadow-sm border border-slate-200">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-3xl bg-gradient-to-br ${item.color} text-white mb-4`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent requests</p>
                <h3 className="text-xl font-black text-slate-900">Latest Gate Passes</h3>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Updated just now</span>
            </div>
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-white text-[11px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Exit</th>
                    <th className="px-4 py-3">Return</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {requests.slice(0, 6).map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">{request.student}</div>
                        <div className="text-[11px] text-slate-500">{request.standard}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{request.destination}</td>
                      <td className="px-4 py-4 text-slate-600">{request.exitTime}</td>
                      <td className="px-4 py-4 text-slate-600">{request.returnTime}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black ${statusStyle(request.status)}`}>
                          <span className="w-2 h-2 rounded-full bg-current" />
                          {request.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GatePassPage;
