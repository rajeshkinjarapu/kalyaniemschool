import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Search, Users, Eye, ArrowLeft, Phone, IdCard, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const TeacherStudentsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const res = await api.get('/api/students', { params: { limit: 5000 } });
      return res.data?.data || res.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student: any) => {
      const studentName = student.user?.name?.toLowerCase() || '';
      const rollNo = student.rollNo?.toLowerCase() || '';
      const className = `${student.class?.name || ''}-${student.class?.section || ''}`.toLowerCase();
      return studentName.includes(query) || rollNo.includes(query) || className.includes(query);
    });
  }, [students, search]);

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
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-0 sm:p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen pb-10 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 sm:p-6 md:p-8 rounded-none sm:rounded-3xl shadow-xl text-white transform transition-all sm:hover:scale-[1.01]">
        <div className="flex items-center gap-4 min-w-0">
          <div className="p-3 rounded-2xl bg-white/20 shadow-inner backdrop-blur-md border border-white/30 shrink-0">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-md" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">Total Students</h2>
            <p className="text-indigo-100 mt-1 sm:mt-2 font-medium text-sm sm:text-lg opacity-90 leading-snug truncate">View all students across the school</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="w-full sm:w-72 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no or class..."
              className="w-full pl-12 pr-4 py-2.5 bg-white border-2 border-transparent rounded-2xl text-sm font-semibold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-300/50 transition-all placeholder:text-slate-400 text-slate-700 shadow-inner"
            />
          </div>
          <Link to="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 rounded-2xl transition-colors border border-white/30 whitespace-nowrap">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <div className="space-y-4 px-3 sm:px-0">
          {filteredStudents.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-white/50 p-12 text-center backdrop-blur-sm">
              <UserCircle className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
              <p className="text-xl font-bold text-slate-600">No students found</p>
              <p className="text-slate-500 mt-2">Try adjusting your search query.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student: any, idx: number) => {
                const name = student.user?.name || 'Unknown';
                const photoUrl = student.user?.photoUrl;
                
                return (
                  <div key={student.id} className="group flex flex-col justify-between rounded-3xl border-2 border-slate-100 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    {/* Index badge */}
                    <div className="absolute top-4 right-4 bg-slate-50 text-slate-400 font-black text-xs px-2 py-1 rounded-lg">
                      #{idx + 1}
                    </div>

                    <div className="flex items-start gap-4 mb-4 mt-2">
                      <div className="shrink-0">
                        {photoUrl ? (
                          <img 
                            src={photoUrl.startsWith('http') ? photoUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}`} 
                            alt={name} 
                            className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl object-cover shadow-md border-2 border-white ring-1 ring-slate-100 group-hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className={`w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-gradient-to-br ${getColor(name)} flex items-center justify-center text-white font-black text-2xl shadow-md border-2 border-white ring-1 ring-slate-100 group-hover:scale-105 transition-transform`}>
                            {getInitials(name)}
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1 pt-1">
                        <Link to={`/students/${student.id}`} className="block">
                          <h3 className="font-extrabold text-lg sm:text-xl text-slate-800 hover:text-indigo-600 truncate transition-colors leading-tight" title={name}>
                            {name}
                          </h3>
                        </Link>
                        
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">
                            Class {student.class?.name || 'N/A'}-{student.class?.section || 'N/A'}
                          </span>
                          {student.rollNo && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <IdCard className="w-3.5 h-3.5" />
                              {student.rollNo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold truncate max-w-[120px]" title={student.fatherName || student.parentName || student.user?.phone || 'No Contact'}>
                          {student.fatherName || student.parentName || student.user?.phone || 'No Contact'}
                        </span>
                      </div>
                      <Link 
                        to={`/students/${student.id}`} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <Eye className="w-4 h-4" /> View Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {filteredStudents.length > 0 && (
            <div className="mt-6 flex items-center justify-center pb-4">
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md text-sm text-slate-600 font-bold border border-slate-200 shadow-sm">
                Showing <span className="text-indigo-600 font-black">{filteredStudents.length}</span> students
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherStudentsPage;
