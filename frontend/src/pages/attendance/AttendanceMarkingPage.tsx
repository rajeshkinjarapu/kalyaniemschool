import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const AttendanceMarkingPage: React.FC = () => {
  const [classes, setClasses] = useState<any[]>([]);
  
  // Filter form states (Matching screenshot)
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Loaded roster states
  const [activeClassId, setActiveClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<{ [studentId: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // Datatable states
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      const data = res.data || res || [];
      setClasses(data);
      
      // Pre-select first class name if available
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

  // Update sections when class name changes
  useEffect(() => {
    if (selectedClassName) {
      const sections = classes.filter(c => c.name === selectedClassName).map(c => c.section);
      if (sections.length > 0 && !sections.includes(selectedSection)) {
        setSelectedSection(sections[0]);
      }
    }
  }, [selectedClassName, classes]);

  const loadStudentRoster = async () => {
    // Find the class matching the selected name and section
    const matchedClass = classes.find(c => c.name === selectedClassName && c.section === selectedSection);
    if (!matchedClass) {
      toast.error('No matching class-section found.');
      return;
    }

    const classId = matchedClass.id;
    setActiveClassId(classId);
    setLoading(true);
    setCurrentPage(1); // Reset page on query load

    try {
      // 1. Get class attendance for date
      const attendanceRes: any = await api.get(`/api/attendance/class`, {
        params: { classId, date },
      });
      const attendanceList = attendanceRes.data || [];

      // 2. Get students in class
      const studentsRes: any = await api.get(`/api/classes/${classId}/students`);
      const studentList = studentsRes.data || [];

      setStudents(studentList);

      // Map existing records
      const initialRecords: { [studentId: string]: string } = {};
      studentList.forEach((s: any) => {
        const record = attendanceList.find((a: any) => a.studentId === s.id);
        initialRecords[s.id] = record?.status || 'PRESENT';
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

  // Unique list of class names and sections for filter selects
  const uniqueClassNames = Array.from(new Set(classes.map(c => c.name)));
  const availableSections = classes.filter(c => c.name === selectedClassName).map(c => c.section);

  // Datatable filtering and pagination
  const filteredStudents = students.filter(student =>
    student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

  // Custom radio colors matching the screenshot
  const statusConfig = [
    { key: 'PRESENT', label: 'Present', bg: 'bg-[#2ecc71] border-[#2ecc71] text-white', text: 'text-[#2ecc71] border-[#2ecc71] hover:bg-[#2ecc71]/10' },
    { key: 'LATE', label: 'Late', bg: 'bg-[#f1c40f] border-[#f1c40f] text-white', text: 'text-[#f1c40f] border-[#f1c40f] hover:bg-[#f1c40f]/10' },
    { key: 'ABSENT', label: 'Absent', bg: 'bg-[#e74c3c] border-[#e74c3c] text-white', text: 'text-[#e74c3c] border-[#e74c3c] hover:bg-[#e74c3c]/10' },
    { key: 'SICK', label: 'Sick', bg: 'bg-[#ff7675] border-[#ff7675] text-white', text: 'text-[#ff7675] border-[#ff7675] hover:bg-[#ff7675]/10' },
    { key: 'PERMIT', label: 'Permit', bg: 'bg-[#95a5a6] border-[#95a5a6] text-white', text: 'text-[#95a5a6] border-[#95a5a6] hover:bg-[#95a5a6]/10' },
  ];

  return (
    <div className="space-y-6">
      {/* ══ HEADER TITLE ══ */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Manage Attendance</h2>
      </div>

      {/* ══ SUB NAVIGATION TABS ══ */}
      <div className="border-b border-gray-200 dark:border-gray-800 flex gap-4">
        <Link
          to="/attendance"
          className="border-b-2 border-indigo-650 px-4 py-2.5 text-sm font-black text-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-xl"
        >
          Attendances
        </Link>
        <Link
          to="/attendance/report"
          className="border-b-2 border-transparent px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Attendances Report
        </Link>
      </div>

      {/* ══ FILTER PANEL (Matching screenshot inputs) ══ */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xs flex flex-wrap items-end gap-5">
        <div className="space-y-1.5 min-w-[120px] flex-1 sm:flex-initial">
          <label className="label text-xs uppercase font-extrabold text-gray-400">Class</label>
          <select
            value={selectedClassName}
            onChange={(e) => setSelectedClassName(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {uniqueClassNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 min-w-[100px] flex-1 sm:flex-initial">
          <label className="label text-xs uppercase font-extrabold text-gray-400">Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {availableSections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 min-w-[160px] flex-1 sm:flex-initial">
          <label className="label text-xs uppercase font-extrabold text-gray-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <button
          onClick={loadStudentRoster}
          className="px-6 py-2.5 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-extrabold rounded-xl text-sm transition-all cursor-pointer shadow-md shadow-[#2ecc71]/15"
        >
          VIEW
        </button>
      </div>

      {/* ══ STUDENTS LIST CONTAINER ══ */}
      {activeClassId ? (
        loading ? (
          <LoadingSpinner size="lg" className="py-24" />
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* Datatable controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg px-2 py-1 font-bold outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => markAllAs('PRESENT')}
                  className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer"
                >
                  ✓ Mark All Present
                </button>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-150 dark:border-gray-800 font-extrabold text-[10px] text-gray-400 tracking-wider">
                    <th className="p-4">Student</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedStudents.map((student) => {
                    const currentStatus = records[student.id] || 'PRESENT';
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-850/10">
                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                          {student.user.name}
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex flex-wrap gap-2 justify-end">
                            {statusConfig.map((sc) => {
                              const active = currentStatus === sc.key;
                              return (
                                <button
                                  key={sc.key}
                                  type="button"
                                  onClick={() => handleStatusChange(student.id, sc.key)}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    active ? sc.bg : sc.text
                                  }`}
                                >
                                  {/* Custom circle mimicking native radio button */}
                                  <span className={`w-2.5 h-2.5 rounded-full border border-current flex items-center justify-center`}>
                                    {active && <span className="w-1.2 h-1.2 rounded-full bg-white block" />}
                                  </span>
                                  {sc.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedStudents.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-12 text-center text-gray-400">
                        No students found matching selection criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <span className="text-xs text-gray-400 font-semibold">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredStudents.length)} of {filteredStudents.length} entries
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-2 border rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                        currentPage === page
                          ? 'bg-indigo-650 border-indigo-650 text-white shadow'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-2 border rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Update Button */}
            {students.length > 0 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-extrabold rounded-xl text-sm transition-all cursor-pointer shadow-md shadow-[#2ecc71]/15 uppercase tracking-wide"
                >
                  UPDATE
                </button>
              </div>
            )}

          </div>
        )
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-16 text-center text-gray-400 shadow-sm min-h-[300px] flex flex-col items-center justify-center">
          <ShieldAlert className="w-12 h-12 text-gray-300 mb-3" />
          <p className="font-semibold text-sm">Please select a class and section, then click VIEW to record student attendances.</p>
        </div>
      )}

    </div>
  );
};
export default AttendanceMarkingPage;
