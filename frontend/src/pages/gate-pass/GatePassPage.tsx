import React, { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { FileText, CheckCircle2, XCircle, PlusCircle, Printer, Clock, LogOut, MapPin, User, ChevronDown, Check } from 'lucide-react';
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
  class?: { name: string; section: string };
}

const GatePassPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<GatePassItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState('JY SCHOOL');
  
  // Search & Filter state
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({ reason: '', destination: '', exitTime: '', returnTime: '', notes: '', studentId: '', requestType: user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT' });
  
  const [printGatePass, setPrintGatePass] = useState<any>(null);

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
      api.get('/api/classes').then((res: any) => {
        const data = res.data || res || [];
        setClasses(data);
      }).catch(() => {});
    }
  }, [canApprove]);

  useEffect(() => {
    if (canApprove) {
      let url = '/api/students?limit=500';
      
      if (selectedClassName) {
        const matchedClass = classes.find(c => c.name === selectedClassName && (!selectedSection || c.section === selectedSection));
        if (matchedClass) {
          url += `&classId=${matchedClass.id}`;
        }
      }

      api.get(url).then((response: any) => {
        const list = Array.isArray(response?.data) ? response.data : (response?.data?.data || []);
        setStudents(list);
      }).catch(() => {});
    }
  }, [canApprove, selectedClassName, selectedSection, classes]);

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
    setPrintGatePass(item);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const roleLabel = useMemo(() => {
    if (user?.role === 'STUDENT') return 'Student';
    if (user?.role === 'TEACHER') return 'Teacher';
    return 'Admin';
  }, [user?.role]);

  const uniqueClassNames = Array.from(new Set(classes.map(c => c.name)));
  const availableSections = classes.filter(c => c.name === selectedClassName).map(c => c.section);
  
  const filteredStudents = students.filter(student => 
    !searchQuery || 
    (student.user?.name && student.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      default: return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="print:hidden space-y-6">
        
        {/* Header Section */}
        <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Gate Pass {roleLabel}</h2>
              <p className="text-sm font-medium text-gray-500 mt-1">Request a short leave or exit pass and approve requests from the admin side.</p>
            </div>
          </div>
        </div>

        {/* Create Gate Pass Form */}
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-5 flex items-center gap-3">
            <PlusCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {canApprove ? 'Issue New Gate Pass' : 'New Request'}
            </h3>
          </div>
          
          <form onSubmit={submit} className="p-5 md:p-8 space-y-6">
            
            {/* Admin filters for student selection */}
            {canApprove && (
              <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4 mb-6">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" /> Student Selection
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="label">Class Filter</label>
                    <div className="relative">
                      <select 
                        value={selectedClassName} 
                        onChange={(e) => { setSelectedClassName(e.target.value); setSelectedSection(''); setForm({...form, studentId: ''}); }} 
                        className="input appearance-none"
                      >
                        <option value="">All Classes</option>
                        {uniqueClassNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="label">Section Filter</label>
                    <div className="relative">
                      <select 
                        value={selectedSection} 
                        onChange={(e) => { setSelectedSection(e.target.value); setForm({...form, studentId: ''}); }} 
                        className="input appearance-none disabled:opacity-50"
                        disabled={!selectedClassName}
                      >
                        <option value="">All Sections</option>
                        {availableSections.map((sec) => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="label">Search Student</label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search by name or roll no..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="input pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="label">Select Student <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      className="input appearance-none" 
                      value={form.studentId} 
                      onChange={(e) => setForm({ ...form, studentId: e.target.value })} 
                      required
                    >
                      <option value="">-- Choose a student --</option>
                      {filteredStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.user?.name || 'Unknown'} {student.rollNo ? `(${student.rollNo})` : ''} {student.class ? `- ${student.class.name} ${student.class.section}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="label">Reason <span className="text-red-500">*</span></label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    className="input pl-10" 
                    placeholder="Reason" 
                    value={form.reason} 
                    onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label">Destination / Visiting To</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    className="input pl-10" 
                    placeholder="Destination" 
                    value={form.destination} 
                    onChange={(e) => setForm({ ...form, destination: e.target.value })} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label">Timings</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <LogOut className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="time"
                      className="input pl-9 pr-2" 
                      placeholder="Exit time" 
                      value={form.exitTime} 
                      onChange={(e) => setForm({ ...form, exitTime: e.target.value })} 
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    <input 
                      type="time"
                      className="input pl-9 pr-2" 
                      placeholder="Return time" 
                      value={form.returnTime} 
                      onChange={(e) => setForm({ ...form, returnTime: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="label">Notes</label>
                <textarea 
                  className="input" 
                  placeholder="Notes" 
                  rows={3} 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button className="btn-primary" type="submit">
                {canApprove ? 'Issue Gate Pass' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> 
              Recent Requests
            </h3>
            <span className="badge bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
              {loading ? 'Loading...' : `${items.length} total`}
            </span>
          </div>

          {items.length === 0 && !loading && (
             <div className="card p-12 text-center text-gray-500">
               No gate pass requests found.
             </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="card p-5 hover:shadow-md transition-all flex flex-col relative">
                <div className="absolute top-0 right-0 p-5">
                  <span className={`badge border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="pr-20 mb-4">
                  <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight mb-1">{item.reason}</h4>
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    Requested by {item.requester?.name}
                    <span className="mx-1.5 h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                    {new Date(item.requestedDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  {item.student?.user?.name && (
                    <div className="flex items-start gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">{item.student.user.name}</p>
                        {item.student.class && (
                          <p className="text-xs text-gray-500">{item.student.class.name} {item.student.class.section} {item.student.rollNo ? `· ${item.student.rollNo}` : ''}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {item.destination && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate font-medium">{item.destination}</span>
                    </div>
                  )}
                  {(item.exitTime || item.returnTime) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium">{item.exitTime || '--:--'} to {item.returnTime || '--:--'}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                  {canApprove && item.status === 'PENDING' && (
                    <>
                      <button onClick={() => approve(item.id, 'APPROVED')} className="flex-1 btn-primary !bg-emerald-500 hover:!bg-emerald-600 !shadow-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => approve(item.id, 'REJECTED')} className="flex-1 btn-danger">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {item.status === 'APPROVED' && (
                    <button onClick={() => printSlip(item)} className="w-full btn-secondary">
                      <Printer className="h-4 w-4" /> Print Gate Pass Slip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Hidden Print Component */}
      <GatePassPrint gatePass={printGatePass} />
    </div>
  );
};

export default GatePassPage;
