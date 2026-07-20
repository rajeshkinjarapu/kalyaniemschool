import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export const TeacherAdmitCardsPage: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const selectedExam = exams.find(e => e.id === selectedExamId);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsList = res.data?.data || res.data || [];
        const publishedExams = examsList.filter((e: any) => e.admitCardPublished);
        setExams(publishedExams);
      } catch (err) {
        console.error('Failed to fetch exams', err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedExamId || !selectedClassId) {
        setStudents([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/api/classes/${selectedClassId}/students`);
        setStudents(res.data?.data || res.data || []);
      } catch (e) {
        console.error('Error fetching students', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedExamId, selectedClassId]);

  if (initialLoading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Student Admit Cards</h1>
            <p className="text-indigo-100 font-medium">Select an exam and class to view and download admit cards for your students.</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="flex flex-col sm:flex-row items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800 gap-4 shadow-sm">
        <span className="text-xs font-extrabold uppercase text-gray-400 shrink-0">Select Exam & Class:</span>
        <select 
          value={selectedExamId} 
          onChange={e => { setSelectedExamId(e.target.value); setSelectedClassId(''); }} 
          className="input !py-2 flex-1 max-w-xs"
        >
          <option value="">-- Choose Exam --</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
        </select>

        {selectedExam && (
          <select 
            value={selectedClassId} 
            onChange={e => setSelectedClassId(e.target.value)} 
            className="input !py-2 flex-1 max-w-xs"
          >
            <option value="">-- Choose Class --</option>
            {(selectedExam.classes || []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
            ))}
          </select>
        )}
      </div>

      {loading && <div className="p-12 text-center text-gray-500 font-semibold animate-pulse">Loading Students...</div>}

      {!loading && students.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
              <tr>
                <th className="py-4 px-6">S.No</th>
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-6 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-gray-500">{idx + 1}</td>
                  <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                      {student.user?.name?.[0] || 'S'}
                    </div>
                    {student.user?.name || student.name}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => window.open(`/admit-card-view/${selectedExamId}?studentId=${student.id}`, '_blank')} className="btn-secondary text-sm flex items-center gap-2 ml-auto hover:text-indigo-700 hover:bg-indigo-50">
                      <ExternalLink className="w-4 h-4" /> Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && selectedExamId && selectedClassId && students.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-medium">No students found for this class.</div>
      )}
    </div>
  );
};

export default TeacherAdmitCardsPage;
