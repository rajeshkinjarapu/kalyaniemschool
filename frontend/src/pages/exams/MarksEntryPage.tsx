import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { ArrowLeft, Save, Filter, BookOpen } from 'lucide-react';
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

      // 5. Get existing flat marks
      const flatMarks = examObj.marks || [];
      
      const initialMarks: { [key: string]: number } = {};
      const initialRemarks: { [key: string]: string } = {};

      flatMarks.forEach((m: any) => {
        if (m.student.classId === classId || (currentClass && m.student.rollNo)) { 
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

  const handleSave = async () => {
    const payload = {
      marks: Object.keys(marksData).map((key) => {
        const [studentId, subjectId] = key.split('_');
        const subjectInfo = subjects.find(s => s.id === subjectId);
        return {
          studentId,
          examId: id,
          subjectId,
          marksObtained: marksData[key],
          maxMarks: subjectInfo?.maxMarks || 100,
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
      toast.success('Marks updated successfully!');
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
    <div className="space-y-6 bg-slate-50 min-h-screen p-2 md:p-6 pb-24">
      {/* Header Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/exams?tab=written-exam" className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{exam?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Class: {currentClass?.name}-{currentClass?.section}
              </span>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Max Marks: {exam?.maxMarks}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Filter & Entry Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="bg-indigo-50/50 p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Marks Entry Panel</h3>
              <p className="text-xs text-slate-500 font-medium">Select your subject and enter marks.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Filter className="absolute left-3.5 top-3 w-4 h-4 text-indigo-500" />
              <select 
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all appearance-none"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Entry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest min-w-[250px]">Student Info</th>
                {filteredSubjects.map((sub) => (
                  <th key={sub.id} className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest min-w-[150px]">
                    {sub.name} <span className="text-[10px] text-slate-400 font-normal lowercase">(Max: {sub.maxMarks || 100})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{student.user.name}</p>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 tracking-wider uppercase">{student.rollNo || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  
                  {filteredSubjects.map((sub) => {
                    const key = `${student.id}_${sub.id}`;
                    return (
                      <td key={sub.id} className="px-6 py-5 align-top">
                        <div className="flex flex-col gap-2">
                          <input
                            type="number"
                            min={0}
                            max={sub.maxMarks || 100}
                            value={marksData[key] !== undefined ? marksData[key] : ''}
                            onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                            placeholder={`Obtained`}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all placeholder:font-normal placeholder:text-slate-400"
                          />
                          <input
                            type="text"
                            placeholder="Add remarks..."
                            value={remarksData[key] || ''}
                            onChange={(e) => handleRemarkChange(student.id, sub.id, e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {students.length === 0 && (
                <tr>
                  <td colSpan={filteredSubjects.length + 1} className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                      <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No Students Found</h3>
                    <p className="text-sm text-slate-500 mt-1">There are no students enrolled in this class.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Save Button Area */}
      {students.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-10 sm:hidden">
          <button onClick={handleSave} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            SAVE MARKS 
          </button>
        </div>
      )}

      {/* Desktop Save Button */}
      {students.length > 0 && (
        <div className="hidden sm:flex justify-end pt-4">
          <button onClick={handleSave} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            SAVE MARKS REGISTRY
          </button>
        </div>
      )}
    </div>
  );
};
export default MarksEntryPage;
