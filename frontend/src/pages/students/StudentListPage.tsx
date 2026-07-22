import React, { useState, useRef } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Search, UserPlus, FileDown, Trash2, Eye, Upload, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getPhotoUrl } from '../../utils/photo';

export const StudentListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await api.get('/api/classes');
      return res.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: students = [], isLoading: loading, refetch: fetchStudents } = useQuery({
    queryKey: ['students', search, classId],
    queryFn: async () => {
      const res = await api.get('/api/students', { params: { search, classId, limit: 5000 } });
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const exportStudents = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Student List', 14, 22);
    
    const tableColumn = ["S.No", "Student ID", "Student Name", "Mobile No"];
    const tableRows: any[] = [];

    students.forEach((student: any, index: number) => {
      const studentData = [
        index + 1,
        student.rollNo || '-',
        student.user?.name || '-',
        student.user?.phone || '-'
      ];
      tableRows.push(studentData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' }
    });

    doc.save('Student_List.pdf');
    toast.success('PDF generated successfully!');
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
      {/* No Duplicate Page Header */}

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex-1 relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-indigo-500" />
            <input
              type="text"
              placeholder="Search by name or Student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-indigo-50/30 dark:bg-white/5 border border-indigo-100 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
            />
          </div>
          <span className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-xs font-black text-indigo-600 bg-indigo-100 rounded-lg whitespace-nowrap">
            {students.length} Records
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none cursor-pointer text-gray-900 dark:text-white"
          >
            <option value="">All Classes</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
            ))}
          </select>
          
          {isSuperAdmin && (
            <>
              <button onClick={exportStudents} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-gray-600 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer">
                <FileDown className="w-4 h-4" /> Export
              </button>
            </>
          )}

          {isAdmin && (
            <Link to="/students/new" className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer">
              <UserPlus className="w-4 h-4" /> Add Student
            </Link>
          )}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden backdrop-blur-2xl">
          
          {/* Mobile View */}
          <div className="md:hidden flex flex-col gap-4 p-4 bg-transparent">
            {students.map((student: any, idx: number) => {
              const name = student.user?.name || 'Student';
              const photoUrl = student.user?.photoUrl;
              const className = student.class?.name || '—';
              const section = student.class?.section || '—';
              return (
                <div key={student.id} className="bg-gradient-to-br from-white to-indigo-50/30 p-4 rounded-3xl shadow-sm hover:shadow-glow-primary hover:-translate-y-1 transition-all duration-300 border border-indigo-50 flex items-center gap-4 relative overflow-visible mt-2 backdrop-blur-md animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-lg border-2 border-white dark:border-indigo-500 z-10">
                    {idx + 1}
                  </div>
                  
                  <div className="shrink-0 pl-2">
                    {photoUrl ? (
                      <img 
                        src={getPhotoUrl(photoUrl)} 
                        alt={name} 
                        className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white dark:border-white/10" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                        }}
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getColor(name)} flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white dark:border-white/10`}>
                        {getInitials(name)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link to={`/students/${student.id}`} className="font-extrabold text-[15px] text-indigo-950 truncate block hover:text-indigo-600 transition-colors mb-2">
                      {name}
                    </Link>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/30">{student.rollNo || '—'}</span>
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-200 bg-teal-50 dark:bg-teal-500/20 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-500/30">{className}-{section}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    <Link to={`/students/${student.id}`} className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30 rounded-xl transition-all border border-indigo-100 cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-indigo-50/50 border-b border-indigo-100">
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-300">#</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Photo</th>
                  <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Student Name</th>
                  <th className="hidden md:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Student ID</th>
                  <th className="hidden sm:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Class</th>
                  <th className="hidden sm:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Section</th>
                  <th className="hidden lg:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Father Name</th>
                  <th className="hidden lg:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Mobile No</th>
                  <th className="hidden sm:table-cell px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {students.map((student: any, idx: number) => {
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
                      className="hover:bg-white bg-transparent transition-all duration-300 group border-b border-indigo-50/50 hover:shadow-glow-primary animate-fade-in-up"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Sr No */}
                      <td className="px-5 py-4 text-indigo-400 font-black text-xs">{idx + 1}</td>

                      {/* Photo */}
                      <td className="px-5 py-3">
                        {photoUrl ? (
                          <img
                            src={getPhotoUrl(photoUrl)}
                            alt={name}
                            className="w-12 h-16 rounded-xl object-cover border-2 border-white dark:border-gray-800 shadow-lg ring-2 ring-indigo-100 dark:ring-indigo-900/30 transform group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                            }}
                          />
                        ) : (
                          <div className={`w-12 h-16 rounded-xl bg-gradient-to-br ${getColor(name)} flex items-center justify-center text-white font-black text-xl shadow-lg shadow-${getColor(name).split('-')[1]}-500/30 transform group-hover:scale-105 transition-transform`}>
                            {getInitials(name)}
                          </div>
                        )}
                      </td>

                      {/* Student Name */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link to={`/students/${student.id}`} className="font-extrabold text-gray-900 dark:text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 transition-all underline decoration-indigo-200 dark:decoration-indigo-900/50 underline-offset-4 group-hover:decoration-indigo-500">
                          {name}
                        </Link>
                      </td>

                      {/* Student ID */}
                      <td className="hidden md:table-cell px-5 py-4">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg">
                          {student.rollNo || '—'}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="hidden sm:table-cell px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400">
                          {className}
                        </span>
                      </td>

                      {/* Section */}
                      <td className="hidden sm:table-cell px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">
                          {section}
                        </span>
                      </td>

                      {/* Father Name */}
                      <td className="hidden lg:table-cell px-5 py-4 text-gray-700 dark:text-gray-300 font-semibold text-xs">
                        {fatherName}
                      </td>

                      {/* Mobile No */}
                      <td className="hidden lg:table-cell px-5 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                        {mobile}
                      </td>

                      {/* Actions */}
                      <td className="hidden sm:table-cell px-5 py-4 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <Link
                            to={`/students/${student.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-extrabold text-indigo-600 dark:text-white bg-indigo-50 hover:bg-indigo-100 dark:bg-white/10 dark:hover:bg-white/20 rounded-lg transition-all"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all cursor-pointer"
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
            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
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
