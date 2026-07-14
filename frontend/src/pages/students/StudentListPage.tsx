import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Search, UserPlus, FileDown, Trash2, Eye, Upload, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const importToast = toast.loading('Uploading and importing spreadsheet...');
    try {
      const res: any = await api.post('/api/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data;
      toast.success(`Import complete! Successfully added ${data.success} students.`, { id: importToast, duration: 4000 });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Bulk import failed. Please verify format rules.', { id: importToast });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePhotoImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const importToast = toast.loading('Uploading and extracting ZIP photos...');
    try {
      const res: any = await api.post('/api/students/bulk-photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data.data || res.data;
      toast.success(`Photos imported! Successfully updated ${data.success} students.`, { id: importToast, duration: 5000 });
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Bulk photo upload failed. Ensure files are named as StudentID.jpg', { id: importToast });
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/api/students', { params: { search, classId, limit: 5000 } });
      setStudents(response.data.data || response.data || []);
    } catch (error) {
      toast.error('Failed to load students list');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response: any = await api.get('/api/classes');
      setClasses(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 300);
    return () => clearTimeout(timer);
  }, [search, classId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student profile?')) return;
    try {
      await api.delete(`/api/students/${id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const exportStudents = async () => {
    const t = toast.loading('Generating Excel sheet...');
    try {
      const response: any = await api.get(`/api/reports/students?classId=${classId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Report downloaded!', { id: t });
    } catch {
      toast.error('Failed to export data.', { id: t });
    }
  };

  const downloadTemplate = async () => {
    const t = toast.loading('Downloading template...');
    try {
      const response: any = await api.get('/api/students/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Template downloaded!', { id: t });
    } catch {
      toast.error('Failed to download template.', { id: t });
    }
  };

  // Initials avatar fallback
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name[0].toUpperCase();
  };

  const avatarColors = [
    'from-indigo-500 to-purple-600',
    'from-teal-400 to-emerald-600',
    'from-rose-400 to-pink-600',
    'from-amber-400 to-orange-500',
    'from-blue-400 to-cyan-500',
    'from-violet-500 to-fuchsia-600',
  ];

  const getColor = (name: string) => {
    const idx = name ? name.charCodeAt(0) % avatarColors.length : 0;
    return avatarColors[idx];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Students</h2>
            <p className="text-xs text-indigo-500 font-semibold">Home / Students</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 px-3 py-1.5 rounded-full">
            {students.length} Records
          </span>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or Student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/25 font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none cursor-pointer"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
            ))}
          </select>
          <button onClick={exportStudents} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
            <FileDown className="w-4 h-4" /> Export
          </button>
          
          <input type="file" ref={photoInputRef} onChange={handlePhotoImport} className="hidden" accept=".zip" />
          <button onClick={() => photoInputRef.current?.click()} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
            <Upload className="w-4 h-4" /> Bulk Photos (ZIP)
          </button>

          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.csv" />
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
            <FileDown className="w-4 h-4" /> Get Template
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
            <Upload className="w-4 h-4" /> Import Sheet
          </button>
          <Link to="/students/new" className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold text-white bg-[#243e8b] hover:bg-[#1a2d66] rounded-xl shadow-md shadow-[#243e8b]/20 transition-all cursor-pointer">
            <UserPlus className="w-4 h-4" /> Add Student
          </Link>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">#</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Photo</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Student Name</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Student ID</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Class</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Section</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Father Name</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Mobile No</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {students.map((student, idx) => {
                  const name = student.user?.name || 'Student';
                  const photoUrl = student.user?.photoUrl;
                  const className = student.class?.name || '—';
                  const section = student.class?.section || '—';
                  const fatherName = student.fatherName || student.parentName || '—';
                  const mobile = student.user?.phone || student.phone || '—';
                  const admissionDate = student.admissionDate
                    ? new Date(student.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors group"
                    >
                      {/* Sr No */}
                      <td className="px-5 py-4 text-gray-400 font-bold text-xs">{idx + 1}</td>

                      {/* Photo */}
                      <td className="px-5 py-3">
                        {photoUrl ? (
                          <img
                            src={photoUrl.startsWith('http') ? photoUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`}
                            alt={name}
                            className="w-12 h-16 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-md ring-1 ring-gray-200 dark:ring-gray-700"
                          />
                        ) : (
                          <div className={`w-12 h-16 rounded-lg bg-gradient-to-br ${getColor(name)} flex items-center justify-center text-white font-black text-lg border-2 border-white dark:border-gray-800 shadow-md ring-1 ring-gray-200 dark:ring-gray-700`}>
                            {getInitials(name)}
                          </div>
                        )}
                      </td>

                      {/* Student Name */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link to={`/students/${student.id}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {name}
                        </Link>
                      </td>

                      {/* Student ID */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg">
                          {student.rollNo || '—'}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400">
                          {className}
                        </span>
                      </td>

                      {/* Section */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                          {section}
                        </span>
                      </td>

                      {/* Father Name */}
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300 font-semibold text-xs">
                        {fatherName}
                      </td>

                      {/* Mobile No */}
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                        {mobile}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <Link
                            to={`/students/${student.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-extrabold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 rounded-lg transition-all"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <Users className="w-12 h-12 opacity-30" />
                        <p className="font-semibold text-sm">No student records found.</p>
                        <Link to="/students/new" className="text-indigo-500 hover:text-indigo-600 text-xs font-bold underline">Add your first student →</Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {students.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-semibold">
                Showing <span className="text-gray-700 dark:text-gray-200 font-bold">{students.length}</span> student{students.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">JY SCHOOL</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default StudentListPage;
