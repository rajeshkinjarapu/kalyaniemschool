import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { Search, UserPlus, Trash2, Edit, Upload, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../hooks/useAuth';
import { getPhotoUrl } from '../../utils/photo';

export const TeacherListPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);



  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/api/teachers', {
        params: { search, limit: 5000 },
      });
      setTeachers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.delete(`/api/teachers/${id}`);
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete teacher');
    }
  };

  const exportTeachers = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Teacher List', 14, 22);
    
    const tableColumn = ["S.No", "Teacher ID", "Name", "Mobile No", "Subject(s)"];
    const tableRows: any[] = [];

    teachers.forEach((teacher: any, index: number) => {
      const teacherData = [
        index + 1,
        teacher.employeeId || '-',
        teacher.user?.name || '-',
        teacher.user?.phone || '-',
        teacher.specialization || '-'
      ];
      tableRows.push(teacherData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' }
    });

    doc.save('Teacher_List.pdf');
    toast.success('PDF generated successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 dark:bg-white/5 p-4 rounded-2xl border border-gray-150 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex-1 relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-indigo-500" />
            <input
              type="text"
              placeholder="Search teachers by name or employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-indigo-50/30 dark:bg-white/5 border border-indigo-100 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300"
            />
          </div>
          <span className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-xs font-black text-indigo-600 bg-indigo-100 rounded-lg whitespace-nowrap">
            {teachers.length} Records
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isSuperAdmin && (
            <>
              <button onClick={exportTeachers} className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold text-gray-600 dark:text-white bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer">
                <FileDown className="w-4 h-4" /> Export
              </button>
            </>
          )}
          <Link to="/teachers/new" className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-500/25 transition-all cursor-pointer">
            <UserPlus className="w-4 h-4" /> Add Teacher
          </Link>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden backdrop-blur-2xl">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50/50 text-indigo-900 font-semibold border-b border-indigo-100">
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400">Teacher</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400">Employee ID</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400">Subject</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400">Qualification</th>
                  <th className="px-6 py-4 font-extrabold text-xs uppercase tracking-wider text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-white/5">
                {teachers.map((teacher, idx) => {
                  const avatarColors = [
                    'from-indigo-500 to-purple-600',
                    'from-teal-400 to-emerald-600',
                    'from-rose-400 to-pink-600',
                    'from-amber-400 to-orange-500',
                    'from-blue-400 to-cyan-500',
                    'from-violet-500 to-fuchsia-600',
                  ];
                  const name = teacher.user?.name || 'Teacher';
                  const colorIdx = name.charCodeAt(0) % avatarColors.length;
                  const colorClass = avatarColors[colorIdx];
                  const getInitials = (n: string) => {
                    const parts = n.trim().split(' ');
                    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : n[0].toUpperCase();
                  };
                  return (
                  <tr key={teacher.id} className="hover:bg-white bg-transparent transition-all duration-300 group border-b border-indigo-50/50 hover:shadow-glow-primary animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="relative">
                        {getPhotoUrl(teacher.user?.photoUrl) ? (
                           <img src={getPhotoUrl(teacher.user?.photoUrl)} alt={name} className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-gray-100 dark:border-white/10" />
                        ) : (
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black text-lg shadow-sm border-2 border-white dark:border-white/10`}>
                            {getInitials(name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">
                          {name}
                        </h4>
                        <span className="text-[11px] font-bold text-gray-400">{teacher.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                        {teacher.employeeId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-teal-700 bg-teal-50 dark:text-teal-200 dark:bg-teal-500/20 px-2.5 py-1 rounded-lg border border-teal-100 dark:border-teal-500/30">
                        {teacher.specialization || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10">
                        {teacher.qualification || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/teachers/${teacher.id}`}
                          className="flex items-center justify-center w-8 h-8 bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-600 dark:hover:text-white rounded-lg transition-all shadow-sm border border-gray-200 dark:border-white/10 cursor-pointer"
                          title="View Profile"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </Link>
                        {isSuperAdmin && (
                          <>
                            <Link
                              to={`/teachers/${teacher.id}/edit`}
                              className="flex items-center justify-center w-8 h-8 bg-gray-50 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-white/10 text-gray-400 hover:text-amber-600 dark:hover:text-white rounded-lg transition-all shadow-sm border border-gray-200 dark:border-white/10 cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(teacher.id)}
                              className="flex items-center justify-center w-8 h-8 bg-gray-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-white/10 text-gray-400 hover:text-red-600 dark:hover:text-white rounded-lg transition-all shadow-sm border border-gray-200 dark:border-white/10 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400 font-semibold">
                      No teacher records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile View */}
          <div className="md:hidden flex flex-col gap-4 p-4 bg-transparent">
             {teachers.map((teacher, idx) => {
                const name = teacher.user?.name || 'Teacher';
                const avatarColors = [
                    'from-indigo-500 to-purple-600',
                    'from-teal-400 to-emerald-600',
                    'from-rose-400 to-pink-600',
                    'from-amber-400 to-orange-500',
                    'from-blue-400 to-cyan-500',
                    'from-violet-500 to-fuchsia-600',
                ];
                const colorIdx = name.charCodeAt(0) % avatarColors.length;
                const colorClass = avatarColors[colorIdx];
                const getInitials = (n: string) => {
                    const parts = n.trim().split(' ');
                    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : n[0].toUpperCase();
                };
                return (
                <div key={teacher.id} className="bg-gradient-to-br from-white to-indigo-50/30 p-4 rounded-3xl shadow-sm hover:shadow-glow-primary hover:-translate-y-1 transition-all duration-300 border border-indigo-50 flex items-center gap-4 relative overflow-visible mt-2 backdrop-blur-md animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                   <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-lg border-2 border-white dark:border-indigo-500 z-10">
                     {idx + 1}
                   </div>
                   <div className="shrink-0 pl-2">
                        {getPhotoUrl(teacher.user?.photoUrl) ? (
                           <img src={getPhotoUrl(teacher.user?.photoUrl)} alt={name} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white dark:border-white/10" />
                        ) : (
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white dark:border-white/10`}>
                            {getInitials(name)}
                          </div>
                        )}
                   </div>
                   <div className="flex-1 min-w-0">
                     <Link to={`/teachers/${teacher.id}`} className="font-extrabold text-[15px] text-indigo-950 truncate block hover:text-indigo-600 transition-colors mb-2">
                       {name}
                     </Link>
                     <div className="flex flex-wrap gap-1.5">
                       <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-500/30">{teacher.employeeId}</span>
                       <span className="text-[10px] font-bold text-teal-700 dark:text-teal-200 bg-teal-50 dark:bg-teal-500/20 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-500/30">{teacher.specialization || 'N/A'}</span>
                     </div>
                   </div>
                   <div className="shrink-0 flex flex-col gap-2">
                     <Link to={`/teachers/${teacher.id}`} className="flex items-center justify-center w-10 h-10 bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-600 dark:hover:text-white rounded-xl transition-all shadow-sm border border-gray-200 dark:border-white/10 cursor-pointer">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                     </Link>
                     {isSuperAdmin && (
                        <button onClick={() => handleDelete(teacher.id)} className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-white/5 hover:bg-red-100 dark:hover:bg-white/10 text-red-400 hover:text-red-600 dark:hover:text-white rounded-xl transition-all shadow-sm border border-red-200 dark:border-white/10 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                     )}
                   </div>
                   
                   <div className="shrink-0">
                     <Link to={`/teachers/${teacher.id}`} className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-500 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30 rounded-xl transition-all border border-indigo-100 cursor-pointer">
                       <Eye className="w-4 h-4" />
                     </Link>
                   </div>
                </div>
                )})}
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherListPage;
