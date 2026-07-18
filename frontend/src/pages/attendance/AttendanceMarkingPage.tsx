import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ShieldAlert, Search, Calendar, Users, ListFilter, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const AttendanceMarkingPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [activeClassId, setActiveClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<{ [studentId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      const data = res.data || res || [];
      setClasses(data);
      
      if (data.length > 0) {
        const uniqueNames = Array.from(new Set(data.map((c: any) => c.name)));
        setSelectedClassName(uniqueNames[0] as string);
        const sections = data.filter((c: any) => c.name === uniqueNames[0]).map((c: any) => c.section);
        setSelectedSection(sections[0] as string);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassName) {
      const sections = classes.filter(c => c.name === selectedClassName).map(c => c.section);
      if (sections.length > 0 && !sections.includes(selectedSection)) {
        setSelectedSection(sections[0]);
      }
    }
  }, [selectedClassName, classes]);

  const loadStudentRoster = async () => {
    const matchedClass = classes.find(c => c.name === selectedClassName && c.section === selectedSection);
    if (!matchedClass) {
      toast.error('No matching class-section found.');
      return;
    }

    const classId = matchedClass.id;
    setActiveClassId(classId);
    setLoading(true);

    try {
      const attendanceRes: any = await api.get(`/api/attendance/class`, {
        params: { classId, date },
      });
      const attendanceList = attendanceRes.data || [];

      const studentsRes: any = await api.get(`/api/classes/${classId}/students`);
      const studentList = studentsRes.data || [];

      setStudents(studentList);

      const initialRecords: { [studentId: string]: string } = {};
      studentList.forEach((s: any) => {
        const record = attendanceList.find((a: any) => a.studentId === s.id);
        initialRecords[s.id] = record?.status === 'ABSENT' ? 'ABSENT' : 'PRESENT';
      });
      setRecords(initialRecords);
    } catch (e) {
      toast.error('Failed to load student roster');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllAs = (status: string) => {
    const newRecords = { ...records };
    students.forEach(s => {
      newRecords[s.id] = status;
    });
    setRecords(newRecords);
  };

  const handleSubmit = async () => {
    if (!activeClassId) return;

    const payload = {
      classId: activeClassId,
      date,
      records: Object.keys(records).map((studentId) => ({
        studentId,
        status: records[studentId],
      })),
    };

    try {
      await api.post('/api/attendance/bulk', payload);
      toast.success('Attendance records saved successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save attendance');
    }
  };

  const uniqueClassNames = Array.from(new Set(classes.map(c => c.name)));
  const availableSections = classes.filter(c => c.name === selectedClassName).map(c => c.section);

  const filteredStudents = students.filter(student =>
    student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen p-0 sm:p-4 md:p-8 pb-24 overflow-x-hidden">
      <div className="px-3 sm:px-0 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex bg-white/60 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-white/50 w-full sm:w-auto overflow-hidden">
          <Link
            to="/attendance"
            className="flex-1 sm:flex-none text-center px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl shadow-md transition-all"
          >
            Marking
          </Link>
          {isAdmin && (
            <Link
              to="/attendance/report"
              className="flex-1 sm:flex-none text-center px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-white/50 rounded-xl transition-all"
            >
              Report
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-lg p-5 sm:p-6 rounded-3xl border border-white shadow-xl shadow-indigo-100/50 flex flex-col md:flex-row items-end gap-4">
        
        <div className="w-full md:flex-1 space-y-1.5">
          <label className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1.5"><ListFilter className="w-3.5 h-3.5" /> Class</label>
          <select
            value={selectedClassName}
            onChange={(e) => setSelectedClassName(e.target.value)}
            className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
          >
            {uniqueClassNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:flex-1 space-y-1.5">
          <label className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
          >
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:flex-1 space-y-1.5">
          <label className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border-2 border-indigo-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
          />
        </div>

        <button
          onClick={loadStudentRoster}
          className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/30 transform hover:-translate-y-1"
        >
          VIEW
        </button>
      </div>

      {activeClassId ? (
        loading ? (
          <div className="flex justify-center items-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-xl shadow-indigo-100/50 overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 sm:p-6 border-b border-indigo-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-indigo-50/30">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h3 className="font-extrabold text-indigo-900">Total Strength</h3>
                  <p className="text-xs font-bold text-indigo-500">{filteredStudents.length} Students</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => markAllAs('PRESENT')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-extrabold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Mark All Present
                </button>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-4 top-3 w-4 h-4 text-indigo-300" />
                  <input
                    type="text"
                    placeholder="Search by name or roll..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-indigo-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* List View - Fully responsive and fits in mobile horizontally without scroll */}
            <div className="p-2 sm:p-6">
              <div className="flex flex-col gap-2 sm:gap-3">
                {/* Headers (Desktop only, hidden on mobile for better space) */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-50">
                  <div className="col-span-1">S.No</div>
                  <div className="col-span-3">ID / Roll</div>
                  <div className="col-span-5">Student Name</div>
                  <div className="col-span-3 text-right">Attendance</div>
                </div>

                {filteredStudents.map((student, index) => {
                  const isPresent = records[student.id] === 'PRESENT';
                  return (
                    <div key={student.id} className="flex flex-col sm:grid sm:grid-cols-12 items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border-2 border-slate-50 bg-white hover:border-indigo-100 hover:shadow-md transition-all">
                      
                      <div className="flex w-full sm:col-span-9 items-center gap-3 sm:gap-4">
                        {/* Avatar / Number */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-800 flex items-center justify-center font-black text-sm shrink-0">
                          {index + 1}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-base truncate">{student.user.name}</h4>
                          <p className="text-xs font-bold text-slate-400 mt-0.5 tracking-widest uppercase truncate">{student.rollNo || student.id.substring(0,8)}</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex w-full sm:col-span-3 justify-center sm:justify-end gap-2 bg-slate-50 sm:bg-transparent p-1 sm:p-0 rounded-xl">
                        <button
                          onClick={() => handleStatusChange(student.id, 'PRESENT')}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg font-bold text-xs transition-all ${
                            isPresent 
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          <CheckCircle className={`w-3.5 h-3.5 ${isPresent ? 'text-white' : 'text-emerald-500'}`} /> P
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'ABSENT')}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg font-bold text-xs transition-all ${
                            !isPresent 
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-rose-50'
                          }`}
                        >
                          <XCircle className={`w-3.5 h-3.5 ${!isPresent ? 'text-white' : 'text-rose-500'}`} /> A
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30">
                    <Users className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
                    <p className="text-indigo-900 font-extrabold text-lg">No Students Found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Save Button */}
            {students.length > 0 && (
              <div className="hidden sm:flex justify-end p-6 border-t border-indigo-50 bg-indigo-50/20">
                <button
                  onClick={handleSubmit}
                  className="px-10 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/30 tracking-wide flex items-center gap-2 transform hover:-translate-y-1"
                >
                  <CheckCircle className="w-5 h-5" /> SAVE ATTENDANCE
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-16 text-center shadow-xl shadow-indigo-100/50 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ShieldAlert className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-indigo-900 mb-2">No Class Selected</h3>
          <p className="font-semibold text-slate-500 text-sm max-w-sm">Please select a class, section, and date, then click <strong className="text-indigo-600">VIEW</strong> to record student attendances.</p>
        </div>
      )}
      </div>

      {/* Mobile Sticky Save Button */}
      {students.length > 0 && activeClassId && (
        <div className="sticky bottom-0 -mx-3 sm:-mx-4 p-4 bg-white/90 backdrop-blur-xl border-t border-indigo-100 z-50 sm:hidden mt-8" style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 active:scale-[0.98] text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-emerald-500/30 tracking-wide flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" /> SAVE ATTENDANCE
          </button>
        </div>
      )}
    </div>
  );
};
export default AttendanceMarkingPage;
