import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const SlipTestsTab: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrTeacher = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const [slipTests, setSlipTests] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testName, setTestName] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [testMaxMarks, setTestMaxMarks] = useState(25);
  const [testClassId, setTestClassId] = useState('');
  const [testSubjectId, setTestSubjectId] = useState('');

  // Marks Entry
  const [activeTest, setActiveTest] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marksData, setMarksData] = useState<{ [studentId: string]: number }>({});

  const fetchData = async () => {
    try {
      const [stRes, classRes, subRes]: any = await Promise.all([
        api.get('/api/slip-tests'),
        api.get('/api/classes'),
        api.get('/api/subjects')
      ]);
      setSlipTests(stRes.data || stRes || []);
      setClasses(classRes.data || classRes || []);
      setSubjects(subRes.data || subRes || []);
    } catch (e) {
      toast.error('Failed to load slip tests');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/slip-tests', {
        name: testName,
        date: testDate,
        maxMarks: testMaxMarks,
        classId: testClassId,
        subjectId: testSubjectId
      });
      toast.success('Slip Test created successfully!');
      setShowCreateModal(false);
      setTestName('');
      setTestMaxMarks(25);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating slip test');
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm('Delete this slip test?')) return;
    try {
      await api.delete(`/api/slip-tests/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleOpenMarks = async (test: any) => {
    try {
      // Fetch students for this class
      const res: any = await api.get(`/api/classes/${test.classId}/students`);
      const studentList = res.data?.students || res.data || [];
      setStudents(studentList);
      
      // Map existing marks
      const initialMarks: any = {};
      if (test.marks && test.marks.length > 0) {
        test.marks.forEach((m: any) => {
          initialMarks[m.studentId] = m.marksObtained;
        });
      }
      setMarksData(initialMarks);
      setActiveTest(test);
    } catch (e) {
      toast.error('Failed to load students for marks entry');
    }
  };

  const handleSaveMarks = async () => {
    try {
      const marksArray = Object.keys(marksData).map(studentId => ({
        studentId,
        marksObtained: marksData[studentId]
      }));
      await api.post(`/api/slip-tests/${activeTest.id}/marks`, { marks: marksArray });
      toast.success('Marks saved successfully!');
      setActiveTest(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to save marks');
    }
  };

  if (activeTest) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
          <div>
            <h3 className="font-bold">Enter Marks: {activeTest.name}</h3>
            <p className="text-xs text-gray-400">Class: {activeTest.class?.name} | Subject: {activeTest.subject?.name} | Max Marks: {activeTest.maxMarks}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTest(null)} className="btn-secondary">Back</button>
            <button onClick={handleSaveMarks} className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Marks</button>
          </div>
        </div>

        <div className="card p-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 font-extrabold text-gray-400 text-xs uppercase">Roll No</th>
                <th className="pb-3 font-extrabold text-gray-400 text-xs uppercase">Student Name</th>
                <th className="pb-3 font-extrabold text-gray-400 text-xs uppercase text-right">Marks Obtained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
              {students.map(s => (
                <tr key={s.id}>
                  <td className="py-3 font-semibold text-gray-500">{s.rollNo}</td>
                  <td className="py-3 font-bold text-gray-900 dark:text-white">{s.user?.name}</td>
                  <td className="py-3 text-right">
                    <input 
                      type="number" 
                      min="0" 
                      max={activeTest.maxMarks}
                      value={marksData[s.id] ?? ''}
                      onChange={e => setMarksData({...marksData, [s.id]: Number(e.target.value)})}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
        <span className="text-xs font-extrabold uppercase text-gray-400">Slip Tests Dashboard</span>
        {isAdminOrTeacher && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
            <Plus className="w-4 h-4" /> Create Slip Test
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {slipTests.map(test => (
          <div key={test.id} className="card p-6 space-y-4 hover:shadow-md border-t-4 border-cyan-500">
            <div>
              <h4 className="font-bold text-base text-gray-900 dark:text-white">{test.name}</h4>
              <p className="text-[11px] text-gray-400 mt-1">Class: {test.class?.name}-{test.class?.section} | Subject: {test.subject?.name}</p>
            </div>
            <div className="text-xs text-gray-500 font-semibold space-y-1">
              <p>Date: {new Date(test.date).toLocaleDateString()}</p>
              <p>Max Marks: {test.maxMarks}</p>
              <p>Graded: {test.marks?.length || 0} students</p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleOpenMarks(test)} className="btn-secondary flex-1 text-xs font-bold flex items-center justify-center gap-2">
                <Edit3 className="w-4 h-4" /> Enter Marks
              </button>
              {isAdminOrTeacher && (
                <button onClick={() => handleDeleteTest(test.id)} className="p-2 border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {slipTests.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            No slip tests created yet.
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Create Slip Test</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-black"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="label">Test Name</label>
                <input type="text" required placeholder="e.g. Chapter 1 Test" value={testName} onChange={e => setTestName(e.target.value)} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Class</label>
                  <select required value={testClassId} onChange={e => setTestClassId(e.target.value)} className="input">
                    <option value="">Select...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select required value={testSubjectId} onChange={e => setTestSubjectId(e.target.value)} className="input">
                    <option value="">Select...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input type="date" required value={testDate} onChange={e => setTestDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Max Marks</label>
                  <input type="number" required value={testMaxMarks} onChange={e => setTestMaxMarks(Number(e.target.value))} className="input" />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
