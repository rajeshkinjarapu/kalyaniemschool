import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus, Trash2, Edit3, Calendar, User, Layers,
  BarChart3, Clock, MapPin, Settings, Save, X, ChevronDown, Wand2, RefreshCw, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Types ─── */
interface PeriodConfig {
  id?: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  label: string;
  isBreak: boolean;
}
interface SlotData {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  day: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string | null;
  subject?: { name: string; code?: string };
  teacher?: { id: string; user: { name: string } };
  class?: { name: string; section: string };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['PRIMARY', 'HIGHER'] as const;

/* ─── Subject color helper ─── */
const SUBJECT_COLORS = [
  { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  { bg: '#FDF2F8', text: '#BE185D', border: '#FBCFE8' },
  { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' },
  { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
];
const getColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return SUBJECT_COLORS[Math.abs(h) % SUBJECT_COLORS.length];
};

export const TimetablePage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'class' | 'teacher' | 'workload' | 'settings'>('class');
  const [activeCategory, setActiveCategory] = useState<'PRIMARY' | 'HIGHER'>('PRIMARY');

  // Data
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Configs
  const [configs, setConfigs] = useState<Record<string, PeriodConfig[]>>({ PRIMARY: [], HIGHER: [] });

  // Timetable data
  const [classTimetable, setClassTimetable] = useState<Record<string, SlotData[]>>({});
  const [teacherTimetable, setTeacherTimetable] = useState<Record<string, SlotData[]>>({});
  const [allSlots, setAllSlots] = useState<SlotData[]>([]);

  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotData | null>(null);
  const [modalDay, setModalDay] = useState('Monday');
  const [modalPeriod, setModalPeriod] = useState(1);
  const [modalClassId, setModalClassId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalTeacherId, setModalTeacherId] = useState('');
  const [modalRoom, setModalRoom] = useState('');

  // Settings edit state
  const [editPeriods, setEditPeriods] = useState<PeriodConfig[]>([]);
  const [settingsCategory, setSettingsCategory] = useState<'PRIMARY' | 'HIGHER'>('PRIMARY');

  /* ─── Fetch helpers ─── */
  const fetchBaseData = async () => {
    try {
      const [cRes, tRes]: any = await Promise.all([
        api.get('/api/classes'),
        api.get('/api/teachers'),
      ]);
      const cl = cRes.data || cRes || [];
      const tl = tRes.data?.data || tRes.data || [];
      setClasses(cl);
      setTeachers(tl);
      if (cl.length) { setSelectedClassId(cl[0].id); setModalClassId(cl[0].id); }
      if (tl.length) { setSelectedTeacherId(tl[0].id); setModalTeacherId(tl[0].id); }
    } catch { /* ignore */ }
  };

  const fetchConfigs = async () => {
    try {
      const res: any = await api.get('/api/timetable/config');
      const all: PeriodConfig[] = res.data || [];
      const grouped: Record<string, PeriodConfig[]> = { PRIMARY: [], HIGHER: [] };
      all.forEach((c: any) => {
        if (!grouped[c.category]) grouped[c.category] = [];
        grouped[c.category].push(c);
      });
      // sort by periodNumber
      Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => a.periodNumber - b.periodNumber));
      setConfigs(grouped);
    } catch { /* ignore */ }
  };

  const fetchClassSchedule = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const [tRes, sRes]: any = await Promise.all([
        api.get(`/api/timetable/class?classId=${selectedClassId}`),
        api.get(`/api/classes/${selectedClassId}/subjects`),
      ]);
      setClassTimetable(tRes.data || {});
      setSubjects(sRes.data || []);
    } catch { toast.error('Failed to load schedule'); }
    finally { setLoading(false); }
  };

  const fetchTeacherSchedule = async () => {
    if (!selectedTeacherId) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/api/timetable/teacher/${selectedTeacherId}`);
      setTeacherTimetable(res.data || {});
    } catch { toast.error('Failed to load teacher schedule'); }
    finally { setLoading(false); }
  };

  const loadAllSlots = async () => {
    if (!classes.length) return;
    try {
      const responses = await Promise.all(classes.map(c => api.get(`/api/timetable/class?classId=${c.id}`)));
      const all: SlotData[] = [];
      responses.forEach((r: any) => {
        Object.values(r.data || {}).forEach((slots: any) => {
          if (Array.isArray(slots)) all.push(...slots);
        });
      });
      setAllSlots(all);
    } catch { /* ignore */ }
  };

  /* ─── Effects ─── */
  useEffect(() => { fetchBaseData(); fetchConfigs(); }, []);
  useEffect(() => { if (selectedClassId) fetchClassSchedule(); }, [selectedClassId]);
  useEffect(() => { if (selectedTeacherId) fetchTeacherSchedule(); }, [selectedTeacherId]);
  useEffect(() => { if (activeTab === 'workload' && classes.length) loadAllSlots(); }, [activeTab, classes]);
  useEffect(() => {
    if (activeTab === 'settings') {
      setEditPeriods(configs[settingsCategory]?.length
        ? configs[settingsCategory].map(p => ({ ...p }))
        : defaultPeriods(settingsCategory));
    }
  }, [activeTab, settingsCategory, configs]);

  // load subjects when modal class changes
  useEffect(() => {
    if (modalClassId) {
      api.get(`/api/classes/${modalClassId}/subjects`)
        .then((r: any) => setSubjects(r.data || []))
        .catch(() => {});
    }
  }, [modalClassId]);

  /* ─── Default period templates ─── */
  const defaultPeriods = (cat: string): PeriodConfig[] => {
    if (cat === 'PRIMARY') return [
      { periodNumber: 1, startTime: '09:00', endTime: '09:40', label: 'Period 1', isBreak: false },
      { periodNumber: 2, startTime: '09:40', endTime: '10:20', label: 'Period 2', isBreak: false },
      { periodNumber: 3, startTime: '10:20', endTime: '10:35', label: 'Break', isBreak: true },
      { periodNumber: 4, startTime: '10:35', endTime: '11:15', label: 'Period 3', isBreak: false },
      { periodNumber: 5, startTime: '11:15', endTime: '11:55', label: 'Period 4', isBreak: false },
      { periodNumber: 6, startTime: '11:55', endTime: '12:30', label: 'Lunch', isBreak: true },
      { periodNumber: 7, startTime: '12:30', endTime: '13:10', label: 'Period 5', isBreak: false },
      { periodNumber: 8, startTime: '13:10', endTime: '13:50', label: 'Period 6', isBreak: false },
    ];
    return [
      { periodNumber: 1, startTime: '09:00', endTime: '09:45', label: 'Period 1', isBreak: false },
      { periodNumber: 2, startTime: '09:45', endTime: '10:30', label: 'Period 2', isBreak: false },
      { periodNumber: 3, startTime: '10:30', endTime: '10:45', label: 'Break', isBreak: true },
      { periodNumber: 4, startTime: '10:45', endTime: '11:30', label: 'Period 3', isBreak: false },
      { periodNumber: 5, startTime: '11:30', endTime: '12:15', label: 'Period 4', isBreak: false },
      { periodNumber: 6, startTime: '12:15', endTime: '13:00', label: 'Lunch', isBreak: true },
      { periodNumber: 7, startTime: '13:00', endTime: '13:45', label: 'Period 5', isBreak: false },
      { periodNumber: 8, startTime: '13:45', endTime: '14:30', label: 'Period 6', isBreak: false },
      { periodNumber: 9, startTime: '14:30', endTime: '15:15', label: 'Period 7', isBreak: false },
      { periodNumber: 10, startTime: '15:15', endTime: '16:00', label: 'Period 8', isBreak: false },
    ];
  };

  /* ─── Determine which category the selected class belongs to ─── */
  const getClassCategory = (): 'PRIMARY' | 'HIGHER' => {
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return activeCategory;
    const n = cls.name?.toLowerCase() || '';
    // Classes 1-5 = PRIMARY, 6+ = HIGHER (heuristic)
    const num = parseInt(n.replace(/\D/g, ''));
    if (!isNaN(num) && num <= 5) return 'PRIMARY';
    return 'HIGHER';
  };

  const currentPeriods = (): PeriodConfig[] => {
    const cat = activeTab === 'class' ? getClassCategory() : activeCategory;
    return configs[cat] || [];
  };

  /* ─── Modal handlers ─── */
  const openSlotModal = (day: string, periodNumber: number, existingSlot?: SlotData) => {
    if (!isAdmin) return;
    setModalDay(day);
    setModalPeriod(periodNumber);
    if (existingSlot) {
      setEditingSlot(existingSlot);
      setModalClassId(existingSlot.classId);
      setModalSubjectId(existingSlot.subjectId);
      setModalTeacherId(existingSlot.teacherId);
      setModalRoom(existingSlot.room || '');
    } else {
      setEditingSlot(null);
      setModalClassId(selectedClassId);
      setModalSubjectId('');
      setModalTeacherId(teachers[0]?.id || '');
      setModalRoom('');
    }
    setShowModal(true);
  };

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const period = currentPeriods().find(p => p.periodNumber === modalPeriod);
    const payload = {
      classId: modalClassId,
      subjectId: modalSubjectId,
      teacherId: modalTeacherId,
      day: modalDay,
      periodNumber: modalPeriod,
      startTime: period?.startTime || '',
      endTime: period?.endTime || '',
      room: modalRoom,
    };
    try {
      if (editingSlot) {
        await api.put(`/api/timetable/${editingSlot.id}`, payload);
        toast.success('Slot updated!');
      } else {
        await api.post('/api/timetable', payload);
        toast.success('Slot added!');
      }
      setShowModal(false);
      fetchClassSchedule();
      fetchTeacherSchedule();
    } catch (err: any) {
      toast.error(err.message || 'Conflict detected!');
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    try {
      await api.delete(`/api/timetable/${id}`);
      toast.success('Deleted!');
      fetchClassSchedule();
      fetchTeacherSchedule();
    } catch { toast.error('Failed to delete'); }
  };

  /* ─── Settings save ─── */
  const handleSaveSettings = async () => {
    try {
      await api.post('/api/timetable/config', {
        category: settingsCategory,
        periods: editPeriods.map((p, i) => ({ ...p, periodNumber: i + 1 })),
      });
      toast.success(`${settingsCategory} period config saved!`);
      fetchConfigs();
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
  };

  const addPeriodRow = () => {
    const n = editPeriods.length + 1;
    setEditPeriods([...editPeriods, { periodNumber: n, startTime: '', endTime: '', label: `Period ${n}`, isBreak: false }]);
  };

  const removePeriodRow = (idx: number) => {
    setEditPeriods(editPeriods.filter((_, i) => i !== idx));
  };

  const updatePeriodRow = (idx: number, field: string, value: any) => {
    const copy = [...editPeriods];
    (copy[idx] as any)[field] = value;
    setEditPeriods(copy);
  };

  /* ─── Auto Generate ─── */
  const [generating, setGenerating] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);

  const handleAutoGenerate = async () => {
    setGenerating(true);
    try {
      const res: any = await api.post('/api/timetable/generate-auto', { clearExisting });
      const count = res.data?.count || res?.count || 0;
      toast.success(`Auto-generated ${count} timetable slots successfully!`);
      setShowAutoModal(false);
      fetchClassSchedule();
      fetchTeacherSchedule();
    } catch (err: any) {
      toast.error(err.message || 'Auto-generation failed');
    } finally {
      setGenerating(false);
    }
  };

  /* ─── TAB BUTTONS ─── */
  const tabs = [
    { key: 'class', label: 'Class Timetable', icon: <Layers className="w-4 h-4" /> },
    { key: 'teacher', label: 'Teacher Timetable', icon: <User className="w-4 h-4" /> },
    { key: 'workload', label: 'Workload Matrix', icon: <BarChart3 className="w-4 h-4" /> },
    ...(isAdmin ? [{ key: 'settings', label: 'Period Settings', icon: <Settings className="w-4 h-4" /> }] : []),
  ];

  /* ─── RENDER ─── */
  return (
    <div className="space-y-5">
      {/* ══ HEADER ══ */}
      <div className="px-4 py-4 md:bg-white md:dark:bg-gray-900 md:p-5 md:rounded-2xl md:border md:border-gray-150 md:dark:border-gray-800 md:shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-500" /> Interactive Timetable Manager
            </h2>
            <p className="text-xs text-gray-400 mt-1">Monday – Saturday · Primary & Higher schedules · Teacher workloads</p>
          </div>
          <div className="flex flex-wrap bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 gap-0.5">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === t.key
                    ? 'bg-white dark:bg-gray-900 text-gray-950 dark:text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FILTER BAR ══ */}
      {(activeTab === 'class' || activeTab === 'teacher') && (
        <div className="px-4 md:px-0 flex flex-col sm:flex-row items-center justify-between gap-3 md:bg-white md:dark:bg-gray-900 py-3 md:rounded-xl md:border md:border-gray-150 md:dark:border-gray-800">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-widest">Filter:</span>
            {activeTab === 'class' ? (
              <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? `-${c.section}` : ''}</option>)}
              </select>
            ) : (
              <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20">
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name} ({t.employeeId})</option>)}
              </select>
            )}
            {activeTab === 'class' && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/20 dark:text-primary-300 uppercase tracking-wide">
                {getClassCategory()} Schedule
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={() => window.print()}
              className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold flex items-center justify-center flex-1 md:flex-none gap-1.5 transition-all cursor-pointer">
              <Printer className="w-4 h-4 text-indigo-500" /> <span className="hidden md:inline">Print</span>
            </button>
            {isAdmin && activeTab === 'class' && (
              <>
                <button onClick={() => openSlotModal('Monday', 1)}
                  className="btn-secondary flex items-center justify-center flex-1 md:flex-none gap-1.5 text-xs font-bold cursor-pointer">
                  <Plus className="w-4 h-4" /> <span className="hidden md:inline">Manual Add</span><span className="md:hidden">Add</span>
                </button>
                <button onClick={() => setShowAutoModal(true)}
                  className="btn-primary flex items-center justify-center flex-1 md:flex-none gap-1.5 text-xs font-bold cursor-pointer">
                  <Wand2 className="w-4 h-4" /> <span className="hidden md:inline">Auto Generate</span><span className="md:hidden">Auto</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ CONTENT ══ */}
      {loading ? <LoadingSpinner size="lg" className="py-16" /> : (
        <>
          {/* ── CLASS TIMETABLE GRID ── */}
          {activeTab === 'class' && (
            <div className="px-4 md:px-0 md:bg-white md:dark:bg-gray-900 md:rounded-xl md:border md:border-gray-150 md:dark:border-gray-800 overflow-hidden md:p-4 print:p-0">
              {/* Print Only Header */}
              <div className="hidden print:block text-center mb-6">
                <h1 className="text-2xl font-black text-indigo-700">JY SCHOOL</h1>
                <h2 className="text-lg font-bold text-gray-800 mt-1">
                  Class Timetable — {classes.find(c => c.id === selectedClassId) ? `${classes.find(c => c.id === selectedClassId).name}${classes.find(c => c.id === selectedClassId).section ? `-${classes.find(c => c.id === selectedClassId).section}` : ''}` : 'All Classes'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Academic Year: {classes.find(c => c.id === selectedClassId)?.academicYear || ''}</p>
                <div className="w-24 h-1 bg-indigo-600 mx-auto mt-2 rounded"></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 w-32">
                        Period / Time
                      </th>
                      {DAYS.map(d => (
                        <th key={d} className="p-3 text-center text-[10px] font-extrabold uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-l border-gray-200 dark:border-gray-800">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentPeriods().map(period => (
                      <tr key={period.periodNumber} className={period.isBreak ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                        {/* Period label cell */}
                        <td className="p-2.5 border-b border-gray-100 dark:border-gray-800 align-top">
                          <div className="text-xs font-extrabold text-gray-700 dark:text-gray-200">{period.label}</div>
                          <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {period.startTime} – {period.endTime}
                          </div>
                        </td>
                        {/* Day cells */}
                        {DAYS.map(day => {
                          if (period.isBreak) {
                            return (
                              <td key={day} className="p-2 border-b border-l border-gray-100 dark:border-gray-800 text-center">
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                  {period.label}
                                </span>
                              </td>
                            );
                          }
                          const slot = (classTimetable[day] || []).find(s => s.periodNumber === period.periodNumber);
                          if (slot) {
                            const color = getColor(slot.subject?.name || '');
                            return (
                              <td key={day} className="p-1.5 border-b border-l border-gray-100 dark:border-gray-800">
                                <div
                                  className="rounded-lg p-2.5 relative group cursor-pointer transition-all hover:scale-[1.02] border"
                                  style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}
                                  onClick={() => isAdmin && openSlotModal(day, period.periodNumber, slot)}
                                >
                                  <div className="font-extrabold text-xs leading-tight">{slot.subject?.name}</div>
                                  <div className="text-[10px] font-semibold opacity-80 mt-0.5">{slot.teacher?.user?.name}</div>
                                  {slot.room && <div className="text-[9px] font-bold opacity-60 mt-0.5 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{slot.room}</div>}
                                  {isAdmin && (
                                    <button
                                      onClick={e => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                                      className="absolute top-1 right-1 p-0.5 rounded bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }
                          return (
                            <td key={day} className="p-1.5 border-b border-l border-gray-100 dark:border-gray-800">
                              <div
                                className={`rounded-lg border border-dashed border-gray-200 dark:border-gray-700 h-14 flex items-center justify-center ${isAdmin ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:border-primary-300 transition-all' : ''}`}
                                onClick={() => isAdmin && openSlotModal(day, period.periodNumber)}
                              >
                                {isAdmin && <Plus className="w-4 h-4 text-gray-300" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {currentPeriods().length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-sm text-gray-400">
                          No period configuration found. Go to <strong>Period Settings</strong> tab to set up periods first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TEACHER TIMETABLE GRID ── */}
          {activeTab === 'teacher' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 overflow-hidden p-4 print:p-0">
              {/* Print Only Header */}
              <div className="hidden print:block text-center mb-6">
                <h1 className="text-2xl font-black text-indigo-700">JY SCHOOL</h1>
                <h2 className="text-lg font-bold text-gray-800 mt-1">
                  Teacher Timetable — {teachers.find(t => t.id === selectedTeacherId)?.user.name || ''}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Category: {activeCategory}</p>
                <div className="w-24 h-1 bg-indigo-600 mx-auto mt-2 rounded"></div>
              </div>
              {/* Category toggle for teacher view */}
              <div className="flex gap-2 p-3 border-b border-gray-100 dark:border-gray-800">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCategory === cat ? 'bg-primary-500 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 w-32">
                        Period / Time
                      </th>
                      {DAYS.map(d => (
                        <th key={d} className="p-3 text-center text-[10px] font-extrabold uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-l border-gray-200 dark:border-gray-800">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(configs[activeCategory] || []).map(period => (
                      <tr key={period.periodNumber} className={period.isBreak ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                        <td className="p-2.5 border-b border-gray-100 dark:border-gray-800 align-top">
                          <div className="text-xs font-extrabold text-gray-700 dark:text-gray-200">{period.label}</div>
                          <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {period.startTime} – {period.endTime}
                          </div>
                        </td>
                        {DAYS.map(day => {
                          if (period.isBreak) {
                            return (
                              <td key={day} className="p-2 border-b border-l border-gray-100 dark:border-gray-800 text-center">
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">{period.label}</span>
                              </td>
                            );
                          }
                          const slot = (teacherTimetable[day] || []).find(s => s.periodNumber === period.periodNumber);
                          if (slot) {
                            const color = getColor(slot.subject?.name || '');
                            return (
                              <td key={day} className="p-1.5 border-b border-l border-gray-100 dark:border-gray-800">
                                <div className="rounded-lg p-2.5 border" style={{ backgroundColor: color.bg, color: color.text, borderColor: color.border }}>
                                  <div className="font-extrabold text-xs">{slot.subject?.name}</div>
                                  <div className="text-[10px] font-semibold opacity-80 mt-0.5">🏫 {slot.class?.name}-{slot.class?.section}</div>
                                </div>
                              </td>
                            );
                          }
                          return (
                            <td key={day} className="p-1.5 border-b border-l border-gray-100 dark:border-gray-800">
                              <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 h-14 flex items-center justify-center text-[10px] text-gray-300">
                                Free
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {(configs[activeCategory] || []).length === 0 && (
                      <tr><td colSpan={7} className="p-12 text-center text-sm text-gray-400">
                        No period config for {activeCategory}. Set up in <strong>Period Settings</strong>.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── WORKLOAD MATRIX ── */}
          {activeTab === 'workload' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="p-3 font-extrabold text-gray-400 text-[10px] uppercase tracking-widest">Teacher</th>
                      <th className="p-3 font-extrabold text-gray-400 text-[10px] uppercase tracking-widest">Employee ID</th>
                      <th className="p-3 font-extrabold text-gray-400 text-[10px] uppercase tracking-widest">Periods / Week</th>
                      <th className="p-3 font-extrabold text-gray-400 text-[10px] uppercase tracking-widest">Classes</th>
                      <th className="p-3 font-extrabold text-gray-400 text-[10px] uppercase tracking-widest w-60">Load Gauge</th>
                      <th className="p-3 font-extrabold text-gray-400 text-[10px] uppercase tracking-widest text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {teachers.map(t => {
                      const tSlots = allSlots.filter(s => s.teacherId === t.id);
                      const count = tSlots.length;
                      const maxLoad = 30; // 5 periods × 6 days target
                      const pct = Math.min((count / maxLoad) * 100, 100);
                      const uniqueClasses = [...new Set(tSlots.map(s => `${s.class?.name}-${s.class?.section}`))].join(', ') || '—';
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="p-3">
                            <div className="font-bold text-gray-900 dark:text-white text-sm">{t.user.name}</div>
                            <div className="text-[10px] text-gray-400">{t.specialization || 'General'}</div>
                          </td>
                          <td className="p-3 text-xs font-bold text-gray-500">{t.employeeId}</td>
                          <td className="p-3 text-sm font-extrabold text-gray-800 dark:text-gray-200">{count}</td>
                          <td className="p-3 text-[10px] text-gray-500 font-semibold max-w-[200px] truncate" title={uniqueClasses}>{uniqueClasses}</td>
                          <td className="p-3">
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${count > 30 ? 'bg-red-500' : count >= 20 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold mt-1 text-right">{count}/{maxLoad}</div>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              count > 30 ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300'
                              : count >= 20 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300'
                            }`}>
                              {count > 30 ? 'Overloaded' : count >= 20 ? 'Optimal' : 'Underloaded'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PERIOD SETTINGS ── */}
          {activeTab === 'settings' && isAdmin && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Period Configuration</h3>
                  <p className="text-xs text-gray-400 mt-1">Define how many periods per day, timings, and break slots for each category.</p>
                </div>
                <div className="flex gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setSettingsCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${settingsCategory === cat ? 'bg-primary-500 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period rows editor */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 px-2">
                  <div className="col-span-1">#</div>
                  <div className="col-span-3">Label</div>
                  <div className="col-span-2">Start Time</div>
                  <div className="col-span-2">End Time</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>
                {editPeriods.map((p, idx) => (
                  <div key={idx} className={`grid grid-cols-12 gap-3 items-center p-2 rounded-lg ${p.isBreak ? 'bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/20' : 'bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800'}`}>
                    <div className="col-span-1 text-sm font-extrabold text-gray-400">{idx + 1}</div>
                    <div className="col-span-3">
                      <input value={p.label} onChange={e => updatePeriodRow(idx, 'label', e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                    <div className="col-span-2">
                      <input type="time" value={p.startTime} onChange={e => updatePeriodRow(idx, 'startTime', e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                    <div className="col-span-2">
                      <input type="time" value={p.endTime} onChange={e => updatePeriodRow(idx, 'endTime', e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                    <div className="col-span-2">
                      <select value={p.isBreak ? 'break' : 'period'} onChange={e => updatePeriodRow(idx, 'isBreak', e.target.value === 'break')}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm font-bold outline-none">
                        <option value="period">📚 Period</option>
                        <option value="break">☕ Break</option>
                      </select>
                    </div>
                    <div className="col-span-2 text-right">
                      <button onClick={() => removePeriodRow(idx)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={addPeriodRow}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-all cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Period / Break
                </button>
                <button onClick={handleSaveSettings}
                  className="btn-primary flex items-center gap-1.5 text-sm font-bold">
                  <Save className="w-4 h-4" /> Save {settingsCategory} Config
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ SLOT MODAL ══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold">{editingSlot ? 'Edit Slot' : 'Assign Slot'}</h3>
                <p className="text-xs text-gray-400">{modalDay} · Period {modalPeriod}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSlotSubmit} className="space-y-4">
              <div>
                <label className="label">Class</label>
                <select value={modalClassId} onChange={e => setModalClassId(e.target.value)} className="input" required>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? `-${c.section}` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Day</label>
                  <select value={modalDay} onChange={e => setModalDay(e.target.value)} className="input">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Period #</label>
                  <input type="number" min={1} value={modalPeriod} onChange={e => setModalPeriod(parseInt(e.target.value) || 1)} className="input" required />
                </div>
              </div>
              <div>
                <label className="label">Subject</label>
                <select value={modalSubjectId} onChange={e => setModalSubjectId(e.target.value)} className="input" required>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Teacher</label>
                <select value={modalTeacherId} onChange={e => setModalTeacherId(e.target.value)} className="input" required>
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user.name} ({t.employeeId})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Room (optional)</label>
                <input type="text" value={modalRoom} onChange={e => setModalRoom(e.target.value)} placeholder="e.g. Lab 201" className="input" />
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">{editingSlot ? 'Update' : 'Assign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ AUTO GENERATE MODAL ══ */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary-500" /> Auto Generate Timetable
              </h3>
              <button onClick={() => setShowAutoModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>How it works:</strong> The auto-generator reads all Class → Subject → Teacher mappings 
                  (from Subjects page) and your Period Settings configuration, then assigns subjects to periods 
                  across Monday–Saturday while avoiding teacher conflicts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Clear existing timetable first</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">If unchecked, auto-generation will only fill empty slots</p>
                  </div>
                </label>
              </div>

              {clearExisting && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs font-semibold text-red-700 dark:text-red-300">
                  ⚠️ Warning: This will delete ALL existing timetable entries before generating new ones.
                </div>
              )}

              <div className="text-xs text-gray-500 font-semibold space-y-1">
                <p>✓ Uses Period Settings (PRIMARY / HIGHER) for correct period structure</p>
                <p>✓ Ensures no teacher teaches two classes at the same time</p>
                <p>✓ Distributes subjects evenly across the week</p>
                <p>✓ Monday to Saturday schedule</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowAutoModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {generating ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><Wand2 className="w-4 h-4" /> Generate Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
