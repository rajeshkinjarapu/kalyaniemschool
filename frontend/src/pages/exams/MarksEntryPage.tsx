import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ArrowLeft, Save, Filter, BookOpen, User, CheckCircle2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const MarksEntryPage: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<{ [key: string]: number }>({});
  const [remarksData, setRemarksData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  const fetchData = async () => {
    try {
      if (!classId) {
        toast.error('No class selected for marks entry.');
        navigate('/exams');
        return;
      }

      // 1. Get Exam
      const examRes: any = await api.get(`/api/exams/${id}`);
      const examObj = examRes.data;
      setExam(examObj);

      // 2. Get specific class
      const classRes: any = await api.get(`/api/classes/${classId}`);
      setCurrentClass(classRes.data);

      // 3. Get students in class
      const studentsRes: any = await api.get(`/api/classes/${classId}/students`);
      setStudents(studentsRes.data || []);

      // 4. Get subjects from exam JSON (fallback to empty array)
      const examSubjects = Array.isArray(examObj.subjects) ? examObj.subjects : [];
      setSubjects(examSubjects);

      // 5. Get existing flat marks from marks API
      const marksRes: any = await api.get(`/api/marks/exam/${id}`);
      const flatMarks = marksRes.data || [];
      
      const initialMarks: { [key: string]: number } = {};
      const initialRemarks: { [key: string]: string } = {};

      flatMarks.forEach((m: any) => {
        if (m.student?.classId === classId || (currentClass && m.student?.rollNo)) { 
          initialMarks[`${m.studentId}_${m.subjectId}`] = m.marksObtained;
          initialRemarks[`${m.studentId}_${m.subjectId}`] = m.remarks || '';
        }
      });

      setMarksData(initialMarks);
      setRemarksData(initialRemarks);
    } catch (e) {
      toast.error('Failed to load marks matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, classId]);

  const handleMarkChange = (studentId: string, subjectId: string, val: string) => {
    setMarksData((prev) => ({
      ...prev,
      [`${studentId}_${subjectId}`]: Number(val),
    }));
  };

  const handleRemarkChange = (studentId: string, subjectId: string, val: string) => {
    setRemarksData((prev) => ({
      ...prev,
      [`${studentId}_${subjectId}`]: val,
    }));
  };

  const handleSave = async (isFreeze = false) => {
    const payload = {
      marks: Object.keys(marksData)
        .filter(key => marksData[key] !== '' && marksData[key] !== undefined && !isNaN(Number(marksData[key])))
        .map(key => {
          const [studentId, subjectId] = key.split('_');
          const subjectInfo = subjects.find(s => s.id === subjectId);
          return {
            studentId,
            examId: id,
            subjectId,
            marksObtained: Number(marksData[key]),
            maxMarks: Number(subjectInfo?.maxMarks) || 100,
            remarks: remarksData[key] || '',
          };
        }),
    };

    if (payload.marks.length === 0) {
      toast.error('No marks to save');
      return;
    }

    try {
      await api.post('/api/marks/bulk', payload);
      toast.success(isFreeze ? 'Marks frozen successfully! No further changes allowed.' : 'Marks saved as draft successfully!');
      navigate('/exams?tab=written-exam');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save marks');
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  const filteredSubjects = selectedSubjectId === 'ALL' 
    ? subjects 
    : subjects.filter(s => s.id === selectedSubjectId);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen font-sans overflow-x-hidden flex flex-col pb-20 md:pb-0">
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 md:p-6 shadow-2xl shadow-purple-500/20 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 sticky top-0 rounded-b-3xl mb-6 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="flex items-center gap-4 z-10">
          <Link to="/exams?tab=written-exam" className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase drop-shadow-sm">{exam?.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="bg-white/20 px-3 py-1 text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm border border-white/10">
                Class: {currentClass?.name}-{currentClass?.section}
              </span>
              <span className="bg-white/20 px-3 py-1 text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm border border-white/10">
                Max Marks: {exam?.maxMarks}
              </span>
            </div>
          </div>
        </div>
        
        {/* Desktop Save Button */}
        {students.length > 0 && (
          <div className="hidden md:flex items-center gap-3 z-10">
            <button onClick={() => handleSave(false)} className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer border border-white/20">
              <Save className="w-4 h-4" />
              SAVE DRAFT
            </button>
            <button onClick={() => handleSave(true)} className="px-6 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5">
              <Lock className="w-4 h-4" />
              FREEZE MARKS
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full p-0 space-y-0 pb-32 bg-transparent">
      <div className="w-full border-0 bg-transparent p-2 md:p-6">
        
        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-200/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-3 rounded-2xl shadow-md shadow-indigo-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Marks Entry Panel</h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Select a subject and enter marks carefully.</p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Filter className="absolute left-4 top-3.5 w-5 h-5 text-indigo-400" />
            <select 
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-indigo-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all appearance-none shadow-sm cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-4 pointer-events-none">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Desktop Table View (Hidden on mobile) */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest min-w-[250px]">Student Info</th>
                {filteredSubjects.map((sub) => (
                  <th key={sub.id} className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-widest min-w-[200px]">
                    <div className="flex flex-col">
                      <span className="text-indigo-900">{sub.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-200/50 w-max px-2 py-0.5 rounded-full">MAX: {sub.maxMarks || 100}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-base">{student.user.name}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1 tracking-wider uppercase bg-slate-100 w-max px-2 py-0.5 rounded-md">{student.rollNo || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  
                  {filteredSubjects.map((sub) => {
                    const key = `${student.id}_${sub.id}`;
                    return (
                      <td key={sub.id} className="px-6 py-5 align-top">
                        <div className="flex flex-col gap-3">
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={sub.maxMarks || 100}
                              value={marksData[key] !== undefined ? marksData[key] : ''}
                              onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                              placeholder="Marks Obtained"
                              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-indigo-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:font-medium placeholder:text-slate-400 shadow-sm"
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet Card View */}
        {/* Mobile View */}
        <div className="lg:hidden space-y-4">
          {students.map((student, index) => (
            <div key={student.id} className="bg-white/80 backdrop-blur-md border border-indigo-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-indigo-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-sm">{student.user.name}</h4>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold mt-1 inline-block">
                    ROLL: {student.rollNo || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {filteredSubjects.map((sub) => {
                  const key = `${student.id}_${sub.id}`;
                  return (
                    <div key={sub.id} className="bg-white rounded-2xl p-4 border border-indigo-50 shadow-sm relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-sm text-indigo-900">{sub.name}</span>
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">MAX: {sub.maxMarks || 100}</span>
                      </div>
                      
                      <div className="space-y-3">
                        <input
                          type="number"
                          min={0}
                          max={sub.maxMarks || 100}
                          value={marksData[key] !== undefined ? marksData[key] : ''}
                          onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                          placeholder="Obtained Marks"
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-base font-black text-indigo-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:font-medium placeholder:text-slate-400 shadow-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {students.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-indigo-100 rounded-3xl bg-indigo-50/30">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm border border-indigo-50 mb-4">
              <User className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-xl font-extrabold text-indigo-900">No Students Found</h3>
            <p className="text-sm font-medium text-slate-500 mt-2">There are no students enrolled in this class to enter marks.</p>
          </div>
        )}
      </div>
      </div>

      {/* Mobile Sticky Save Button */}
      {students.length > 0 && (
        <div className="sticky bottom-0 -mx-4 px-4 p-4 bg-white/90 backdrop-blur-xl border-t border-indigo-100 z-50 md:hidden mt-8 flex gap-3" style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
          <button onClick={() => handleSave(false)} className="flex-1 py-4 bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 active:scale-[0.98] rounded-2xl font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Save className="w-4 h-4" />
            DRAFT
          </button>
          <button onClick={() => handleSave(true)} className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <Lock className="w-4 h-4" />
            FREEZE
          </button>
        </div>
      )}
    </div>
  );
};
export default MarksEntryPage;
