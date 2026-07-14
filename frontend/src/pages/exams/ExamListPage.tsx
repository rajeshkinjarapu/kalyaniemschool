import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus, Edit3, Trash2, ClipboardList, BookOpen, Layers, CheckSquare,
  Clock, Award, FileText, Settings, Play, ShieldAlert, HelpCircle, Save, X, Calendar, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { SlipTestsTab } from './SlipTestsTab';

export const ExamListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrTeacher = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  // Search parameters for linking tabs from sidebar
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Tabs
  const [activeTab, setActiveTab] = useState<'examination' | 'exam-plan' | 'question-group' | 'question-bank' | 'add-online-exam' | 'online-exams' | 'written-exam' | 'admit-card' | 'results' | 'progress-card' | 'settings' | 'slip-tests' | ''>('');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Base Data
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // -------------------------------------------------------------
  // EXAMINATION Tab States & Logic
  // -------------------------------------------------------------
  const [showExamModal, setShowExamModal] = useState(false);
  const [examName, setExamName] = useState('');
  const [examClassId, setExamClassId] = useState('');
  const [examTerm, setExamTerm] = useState('Term 1');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examMaxMarks, setExamMaxMarks] = useState(100);
  
  // Excel Upload States
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelExamId, setExcelExamId] = useState('');

  const fetchExams = async () => {
    try {
      const res: any = await api.get('/api/exams');
      const list = res.data || res || [];
      setExams(list);
      if (list.length > 0 && !selectedExamId) {
        setSelectedExamId(list[0].id);
      }
    } catch (e) {
      toast.error('Failed to load exams');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams', {
        name: examName,
        classId: examClassId,
        term: examTerm,
        examDate: new Date(examDate),
        maxMarks: Number(examMaxMarks),
      });
      toast.success('Exam created successfully!');
      setShowExamModal(false);
      setExamName('');
      fetchExams();
    } catch (err: any) {
      toast.error(err.message || 'Error creating exam');
    }
  };

  // -------------------------------------------------------------
  // EXCEL UPLOAD Logic
  // -------------------------------------------------------------
  const downloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Student ID": "STU123", "Subject Code": "MATH101", "Marks Obtained": 85, "Remarks": "Good" },
      { "Student ID": "STU124", "Subject Code": "MATH101", "Marks Obtained": 90, "Remarks": "Excellent" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, "Sample_Marks_Upload.xlsx");
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile || !excelExamId) {
      toast.error('Please select an exam and a file');
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        // Map excel columns to backend payload
        const mappedMarks = sheet.map((row: any) => ({
          studentId: row['Student ID'] || row['studentId'] || row['Student Id'],
          subjectId: row['Subject Code'] || row['subjectId'] || row['Subject Id'], // assuming the backend can resolve by code or id? Wait, backend needs subjectId. The user can enter Subject ID.
          marksObtained: Number(row['Marks Obtained'] || row['marksObtained'] || row['Marks']),
          remarks: row['Remarks'] || row['remarks'] || ''
        }));

        await api.post('/api/marks/bulk', {
          examId: excelExamId,
          marks: mappedMarks
        });
        toast.success('Excel marks uploaded successfully!');
        setShowExcelModal(false);
        setExcelFile(null);
      };
      reader.readAsBinaryString(excelFile);
    } catch (err) {
      toast.error('Error uploading excel file');
    }
  };

  // -------------------------------------------------------------
  // EXAM PLAN Tab States & Logic
  // -------------------------------------------------------------
  const [examPlans, setExamPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planSubjectId, setPlanSubjectId] = useState('');
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [planStartTime, setPlanStartTime] = useState('09:00');
  const [planEndTime, setPlanEndTime] = useState('12:00');
  const [planRoom, setPlanRoom] = useState('');
  const [planMaxMarks, setPlanMaxMarks] = useState(100);
  const [planPassingMarks, setPlanPassingMarks] = useState(40);

  const fetchExamPlans = async () => {
    if (!selectedExamId) return;
    try {
      const res: any = await api.get(`/api/exams-extended/plans?examId=${selectedExamId}`);
      setExamPlans(res.data || []);
    } catch {
      toast.error('Failed to fetch exam plans');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/plans', {
        examId: selectedExamId,
        subjectId: planSubjectId,
        examDate: planDate,
        startTime: planStartTime,
        endTime: planEndTime,
        room: planRoom,
        maxMarks: Number(planMaxMarks),
        passingMarks: Number(planPassingMarks)
      });
      toast.success('Paper plan scheduled successfully!');
      setShowPlanModal(false);
      fetchExamPlans();
    } catch (err: any) {
      toast.error(err.message || 'Error scheduling paper');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to remove this paper from plan?')) return;
    try {
      await api.delete(`/api/exams-extended/plans/${id}`);
      toast.success('Paper plan deleted');
      fetchExamPlans();
    } catch {
      toast.error('Error deleting exam plan');
    }
  };

  // -------------------------------------------------------------
  // QUESTION GROUP Tab States & Logic
  // -------------------------------------------------------------
  const [questionGroups, setQuestionGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  const fetchQuestionGroups = async () => {
    try {
      const res: any = await api.get('/api/exams-extended/question-groups');
      const list = res.data || [];
      setQuestionGroups(list);
      if (list.length > 0 && !selectedGroupId) {
        setSelectedGroupId(list[0].id);
      }
    } catch {
      toast.error('Failed to load question groups');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/question-groups', {
        name: groupName,
        description: groupDesc
      });
      toast.success('Question group created');
      setShowGroupModal(false);
      setGroupName('');
      setGroupDesc('');
      fetchQuestionGroups();
    } catch (err: any) {
      toast.error(err.message || 'Error creating group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question group?')) return;
    try {
      await api.delete(`/api/exams-extended/question-groups/${id}`);
      toast.success('Group deleted');
      fetchQuestionGroups();
    } catch {
      toast.error('Error deleting group');
    }
  };

  // -------------------------------------------------------------
  // QUESTION BANK Tab States & Logic
  // -------------------------------------------------------------
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('0');
  const [qMarks, setQMarks] = useState(1);

  const fetchQuestions = async () => {
    try {
      const res: any = await api.get(`/api/exams-extended/questions${selectedGroupId ? `?groupId=${selectedGroupId}` : ''}`);
      setQuestions(res.data || []);
    } catch {
      toast.error('Failed to load questions');
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/questions', {
        groupId: selectedGroupId,
        questionText: qText,
        questionType: qType,
        options: qType === 'MCQ' ? qOptions : null,
        correctAnswer: qCorrect,
        marks: Number(qMarks)
      });
      toast.success('Question added to bank');
      setShowQuestionModal(false);
      setQText('');
      setQOptions(['', '', '', '']);
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Error adding question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Delete question?')) return;
    try {
      await api.delete(`/api/exams-extended/questions/${id}`);
      toast.success('Question deleted');
      fetchQuestions();
    } catch {
      toast.error('Error deleting question');
    }
  };

  // -------------------------------------------------------------
  // ONLINE EXAM Tab States & Logic
  // -------------------------------------------------------------
  const [onlineExams, setOnlineExams] = useState<any[]>([]);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineTitle, setOnlineTitle] = useState('');
  const [onlineClassId, setOnlineClassId] = useState('');
  const [onlineSubjectId, setOnlineSubjectId] = useState('');
  const [onlineDuration, setOnlineDuration] = useState(60);
  const [onlineStart, setOnlineStart] = useState(new Date().toISOString().slice(0, 16));
  const [onlineEnd, setOnlineEnd] = useState(new Date().toISOString().slice(0, 16));
  const [onlinePassMarks, setOnlinePassMarks] = useState(40);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);

  // Taking exam states
  const [takingExam, setTakingExam] = useState<any>(null);
  const [takingAnswers, setTakingAnswers] = useState<Record<string, string>>({});
  const [takingTimeLeft, setTakingTimeLeft] = useState(0);

  // Submissions states
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<string | null>(null);

  const fetchOnlineExams = async () => {
    try {
      const res: any = await api.get('/api/exams-extended/online-exams');
      setOnlineExams(res.data || []);
    } catch {
      toast.error('Failed to load online exams');
    }
  };

  const handleCreateOnlineExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQIds.length === 0) {
      toast.error('Please select at least one question');
      return;
    }
    // Compute total marks
    const total = selectedQIds.reduce((sum, qId) => {
      const q = questions.find(item => item.id === qId);
      return sum + (q ? q.marks : 0);
    }, 0);

    try {
      await api.post('/api/exams-extended/online-exams', {
        title: onlineTitle,
        classId: onlineClassId,
        subjectId: onlineSubjectId,
        duration: Number(onlineDuration),
        startTime: onlineStart,
        endTime: onlineEnd,
        totalMarks: total,
        passMarks: Number(onlinePassMarks),
        questionIds: selectedQIds
      });
      toast.success('Online Exam published successfully!');
      setShowOnlineModal(false);
      setOnlineTitle('');
      setSelectedQIds([]);
      fetchOnlineExams();
    } catch (err: any) {
      toast.error(err.message || 'Error publishing online exam');
    }
  };

  const handleDeleteOnlineExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this online exam?')) return;
    try {
      await api.delete(`/api/exams-extended/online-exams/${id}`);
      toast.success('Online exam deleted');
      fetchOnlineExams();
    } catch {
      toast.error('Error deleting online exam');
    }
  };

  const handleStartTakeExam = async (examId: string) => {
    try {
      const res: any = await api.get(`/api/exams-extended/online-exams/${examId}`);
      if (res.data.completed) {
        toast.success(`You already took this exam. Score: ${res.data.marksObtained}`);
        return;
      }
      const data = res.data.exam;
      setTakingExam(data);
      setTakingAnswers({});
      setTakingTimeLeft(data.duration * 60);
    } catch {
      toast.error('Failed to load exam details');
    }
  };

  const handleAnswerChange = (qId: string, answer: string) => {
    setTakingAnswers({ ...takingAnswers, [qId]: answer });
  };

  const handleSubmitOnlineExam = async () => {
    if (!takingExam) return;
    try {
      await api.post(`/api/exams-extended/online-exams/${takingExam.id}/submit`, {
        answers: takingAnswers
      });
      toast.success('Exam submitted successfully!');
      setTakingExam(null);
      fetchOnlineExams();
    } catch {
      toast.error('Error submitting exam');
    }
  };

  const handleViewSubmissions = async (examId: string) => {
    try {
      const res: any = await api.get(`/api/exams-extended/online-exams/${examId}/submissions`);
      setSubmissions(res.data || []);
      setViewingSubmissionsId(examId);
    } catch {
      toast.error('Error fetching submissions');
    }
  };

  // Timer effect for online test
  useEffect(() => {
    if (!takingExam || takingTimeLeft <= 0) {
      if (takingExam && takingTimeLeft === 0) {
        toast.error('Time limit reached! Submitting test automatically.');
        handleSubmitOnlineExam();
      }
      return;
    }
    const timer = setInterval(() => {
      setTakingTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [takingExam, takingTimeLeft]);

  // -------------------------------------------------------------
  // BOOTSTRAPPING
  // -------------------------------------------------------------
  const fetchBaseFilters = async () => {
    try {
      const [classRes, teachRes]: any = await Promise.all([
        api.get('/api/classes'),
        api.get('/api/teachers'),
      ]);
      const classList = classRes.data || classRes || [];
      const teacherList = teachRes.data.data || teachRes.data || [];
      setClasses(classList);
      setTeachers(teacherList);

      if (classList.length > 0) {
        setExamClassId(classList[0].id);
        setOnlineClassId(classList[0].id);
        setSelectedClassId(classList[0].id);
      }
    } catch {
      toast.error('Failed to bootstrap filters');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // QUESTION PAPERS Tab States & Logic (Upload/Download)
  // -------------------------------------------------------------
  const [questionPapers, setQuestionPapers] = useState<any[]>([]);
  const [showQpModal, setShowQpModal] = useState(false);
  const [qpTitle, setQpTitle] = useState('');
  const [qpClassId, setQpClassId] = useState('');
  const [qpSubjectId, setQpSubjectId] = useState('');
  const [qpFileUrl, setQpFileUrl] = useState('');

  const fetchQuestionPapers = async () => {
    try {
      const res: any = await api.get('/api/question-papers');
      setQuestionPapers(res.data || []);
    } catch {
      toast.error('Failed to load question papers');
    }
  };

  const handleCreateQp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/question-papers', {
        title: qpTitle,
        classId: qpClassId,
        subjectId: qpSubjectId,
        fileUrl: qpFileUrl
      });
      toast.success('Question paper uploaded successfully');
      setShowQpModal(false);
      setQpTitle('');
      setQpFileUrl('');
      fetchQuestionPapers();
    } catch {
      toast.error('Error uploading question paper');
    }
  };

  const handleDeleteQp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;
    try {
      await api.delete(`/api/question-papers/${id}`);
      toast.success('Question paper deleted');
      fetchQuestionPapers();
    } catch {
      toast.error('Error deleting question paper');
    }
  };

  useEffect(() => {
    fetchBaseFilters();
    fetchExams();
    fetchQuestionGroups();
    fetchOnlineExams();
    fetchQuestionPapers();
  }, []);

  // Fetch plans when selected exam changes
  useEffect(() => {
    if (selectedExamId) {
      fetchExamPlans();
    }
  }, [selectedExamId]);

  // Fetch questions when group changes
  useEffect(() => {
    fetchQuestions();
  }, [selectedGroupId]);

  // Load subjects for exam plan form
  useEffect(() => {
    const activeExam = exams.find(e => e.id === selectedExamId);
    if (activeExam?.classId) {
      api.get(`/api/classes/${activeExam.classId}/subjects`)
        .then((res: any) => {
          setSubjects(res.data || []);
          if (res.data?.length > 0) {
            setPlanSubjectId(res.data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [selectedExamId, exams]);

  // Load subjects for online exam form
  useEffect(() => {
    if (onlineClassId) {
      api.get(`/api/classes/${onlineClassId}/subjects`)
        .then((res: any) => {
          setSubjects(res.data || []);
          if (res.data?.length > 0) {
            setOnlineSubjectId(res.data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [onlineClassId]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  // -------------------------------------------------------------
  // EXAM TAKING MODAL SCREEN
  // -------------------------------------------------------------
  if (takingExam) {
    const mins = Math.floor(takingTimeLeft / 60);
    const secs = takingTimeLeft % 60;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-red-500 text-white p-5 rounded-2xl shadow">
          <div>
            <h3 className="text-xl font-bold">{takingExam.title}</h3>
            <p className="text-xs opacity-90">Subject: {takingExam.subject?.name}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase block tracking-wider opacity-75">Time Remaining</span>
            <span className="text-2xl font-black">{mins}:{secs < 10 ? '0' : ''}{secs}</span>
          </div>
        </div>

        <div className="space-y-6">
          {takingExam.questions.map((eq: any, index: number) => {
            const q = eq.question;
            const opts = q.options ? JSON.parse(q.options) : [];
            return (
              <div key={q.id} className="card p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    Q{index + 1}. {q.questionText}
                  </h4>
                  <Badge variant="info">Marks: {q.marks}</Badge>
                </div>

                {q.questionType === 'MCQ' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {opts.map((opt: string, optIdx: number) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          takingAnswers[q.id] === String(optIdx)
                            ? 'bg-primary-50 border-primary-500 dark:bg-primary-950/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={optIdx}
                          checked={takingAnswers[q.id] === String(optIdx)}
                          onChange={() => handleAnswerChange(q.id, String(optIdx))}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    placeholder="Type your answer here..."
                    value={takingAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="input"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => {
              if (confirm('Cancel exam? Your answers will not be saved.')) {
                setTakingExam(null);
              }
            }}
            className="btn-secondary"
          >
            Cancel / Give Up
          </button>
          <button onClick={handleSubmitOnlineExam} className="btn-primary">
            Submit Exam
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EXAM SUBMISSIONS VIEW
  // -------------------------------------------------------------
  if (viewingSubmissionsId) {
    const activeExam = onlineExams.find(e => e.id === viewingSubmissionsId);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
          <div>
            <h3 className="font-bold">Submissions: {activeExam?.title}</h3>
            <p className="text-xs text-gray-400">Total Marks: {activeExam?.totalMarks} · Passing Marks: {activeExam?.passMarks}</p>
          </div>
          <button onClick={() => setViewingSubmissionsId(null)} className="btn-secondary">
            Back to Exams
          </button>
        </div>

        <div className="card p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Student Name</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Roll No</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Submitted At</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Marks Obtained</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                {submissions.map((sub) => {
                  const pass = sub.marksObtained >= (activeExam?.passMarks || 40);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                      <td className="py-4 font-bold text-gray-900 dark:text-white">{sub.student?.user?.name}</td>
                      <td className="py-4 text-xs text-gray-400">{sub.student?.rollNo}</td>
                      <td className="py-4 text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                      <td className="py-4 font-bold">{sub.marksObtained} / {activeExam?.totalMarks}</td>
                      <td className="py-4 text-right">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          pass ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                        }`}>
                          {pass ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No submissions recorded yet for this exam.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ══ TOP NAVIGATION GRID ══ */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm mb-6">
        <div className="mb-4">
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            <span>Examinations Suite</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">Select a module below to manage exams, grading, and online tests.</p>
           {!activeTab && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          <button onClick={() => setActiveTab('examination')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Plus className="w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest text-center">Create Exam</span>
          </button>
          
          <button onClick={() => setActiveTab('exam-plan')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg hover:shadow-purple-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Calendar className="w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest text-center">Exam Plan</span>
          </button>
          
          <button onClick={() => setActiveTab('written-exam')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Edit3 className="w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest text-center">Marks Upload</span>
          </button>
          
          <button onClick={() => setActiveTab('admit-card')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <FileText className="w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest text-center">Admit Card</span>
          </button>
          
          <button onClick={() => setActiveTab('results')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Award className="w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest text-center">Results</span>
          </button>
          
          <button onClick={() => setActiveTab('progress-card')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg hover:shadow-rose-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Award className="w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest text-center">Progress Card</span>
          </button>

          {isAdminOrTeacher && (
            <>
              <button onClick={() => setActiveTab('question-group')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg hover:shadow-slate-500/30 hover:-translate-y-1">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <BookOpen className="w-8 h-8" />
                <span className="text-xs font-black uppercase tracking-widest text-center">Question Group</span>
              </button>
              
              <button onClick={() => setActiveTab('question-bank')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-slate-600 to-gray-800 text-white shadow-lg hover:shadow-slate-500/30 hover:-translate-y-1">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Layers className="w-8 h-8" />
                <span className="text-xs font-black uppercase tracking-widest text-center">Question Papers</span>
              </button>
              
              <button onClick={() => setActiveTab('add-online-exam')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg hover:shadow-violet-500/30 hover:-translate-y-1">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus className="w-8 h-8" />
                <span className="text-xs font-black uppercase tracking-widest text-center">Add Online Exam</span>
              </button>
            </>
          )}

          <button onClick={() => setActiveTab('slip-tests')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-cyan-600 to-sky-700 text-white shadow-lg hover:shadow-cyan-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Clock className="w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest text-center">Slip Tests</span>
          </button>

          <button onClick={() => setActiveTab('settings')} className="relative overflow-hidden group flex flex-col items-center justify-center p-6 rounded-2xl border-0 transition-all gap-3 bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg hover:shadow-gray-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Settings className="w-8 h-8" />
            <span className="text-xs font-black uppercase tracking-widest text-center">Settings</span>
          </button>
        </div>
      )}   </div>

      {/* Create Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Configure Exam</h3>
              <button onClick={() => setShowExamModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="label">Exam Name / Title</label>
                <input type="text" required placeholder="e.g. Mid-Term 1" value={examName} onChange={e => setExamName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Class</label>
                <select required value={examClassId} onChange={e => setExamClassId(e.target.value)} className="input">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Term</label>
                  <select value={examTerm} onChange={e => setExamTerm(e.target.value)} className="input">
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="label">Max Marks</label>
                  <input type="number" value={examMaxMarks} onChange={e => setExamMaxMarks(Number(e.target.value))} className="input" />
                </div>
              </div>
              <div>
                <label className="label">Exam Date</label>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="input" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowExamModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">Create Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ TAB 2: EXAM PLAN ══ */}
      {activeTab === 'exam-plan' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold uppercase text-gray-400">Exam Batch:</span>
              <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold">
                {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.class?.name})</option>)}
              </select>
            </div>
            {isAdmin && selectedExamId && (
              <button onClick={() => setShowPlanModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Schedule Paper
              </button>
            )}
          </div>

          <div className="card p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Subject</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Exam Date</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Timing</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Room</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Marks Info</th>
                    {isAdmin && <th className="pb-3.5 text-right font-extrabold text-gray-400 text-xs uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {examPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                      <td className="py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{plan.subject?.name}</div>
                        <span className="text-[10px] text-gray-400 font-bold">{plan.subject?.code}</span>
                      </td>
                      <td className="py-4 text-xs font-semibold text-gray-700 dark:text-gray-200">{new Date(plan.examDate).toLocaleDateString()}</td>
                      <td className="py-4 text-xs text-gray-500 font-bold">{plan.startTime} – {plan.endTime}</td>
                      <td className="py-4 text-xs text-gray-500 font-bold">{plan.room || 'N/A'}</td>
                      <td className="py-4 text-xs font-semibold text-gray-500">Max: {plan.maxMarks} · Pass: {plan.passingMarks}</td>
                      {isAdmin && (
                        <td className="py-4 text-right">
                          <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {examPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        No subject papers scheduled in plan yet for this exam batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showPlanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Schedule Exam Paper</h3>
                  <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreatePlan} className="space-y-4">
                  <div>
                    <label className="label">Select Subject</label>
                    <select required value={planSubjectId} onChange={e => setPlanSubjectId(e.target.value)} className="input">
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Exam Date</label>
                    <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start Time</label>
                      <input type="text" placeholder="09:00" value={planStartTime} onChange={e => setPlanStartTime(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">End Time</label>
                      <input type="text" placeholder="12:00" value={planEndTime} onChange={e => setPlanEndTime(e.target.value)} className="input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="label">Room</label>
                      <input type="text" placeholder="102" value={planRoom} onChange={e => setPlanRoom(e.target.value)} className="input" />
                    </div>
                    <div className="col-span-1">
                      <label className="label">Max Marks</label>
                      <input type="number" value={planMaxMarks} onChange={e => setPlanMaxMarks(Number(e.target.value))} className="input" />
                    </div>
                    <div className="col-span-1">
                      <label className="label">Pass Marks</label>
                      <input type="number" value={planPassingMarks} onChange={e => setPlanPassingMarks(Number(e.target.value))} className="input" />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowPlanModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Save Paper</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 3: MARKS UPLOAD (written-exam) ══ */}
      {activeTab === 'written-exam' && (
        <div className="card p-6 space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Marks Upload / Results Entry</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4 hover:border-indigo-500 transition-colors bg-gray-50/50 dark:bg-gray-800/30">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{exam.name}</h4>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{exam.class?.name} - {exam.class?.section}</p>
                </div>
                <div className="flex gap-3">
                  <Link to={`/exams/${exam.id}/entry`} className="btn-primary flex-1 text-center text-xs py-2.5">
                    Manual Entry
                  </Link>
                  <button onClick={() => { setExcelExamId(exam.id); setShowExcelModal(true); }} className="btn-secondary flex-1 text-xs py-2.5 bg-green-50 text-green-600 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/40">
                    Excel Upload
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showExcelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Upload Marks Excel</h3>
                  <button onClick={() => setShowExcelModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">Instructions:</p>
                  <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 list-disc pl-4 space-y-1">
                    <li>Download the sample Excel file.</li>
                    <li>Fill in the 'Student ID', 'Subject ID', 'Marks Obtained' columns.</li>
                    <li>Upload the filled file back here.</li>
                  </ul>
                  <button onClick={downloadSampleExcel} className="mt-3 text-xs font-bold bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-800 text-blue-600 hover:bg-blue-50 w-full text-center">
                    Download Sample Excel
                  </button>
                </div>

                <form onSubmit={handleExcelUpload} className="space-y-4">
                  <div>
                    <label className="label">Select Excel File</label>
                    <input type="file" accept=".xlsx, .xls" required onChange={e => setExcelFile(e.target.files?.[0] || null)} className="input p-2" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowExcelModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm bg-green-500 hover:bg-green-600">Upload Data</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 4: ADMIT CARD ══ */}
      {activeTab === 'admit-card' && (
        <div className="card p-2 h-[80vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 mb-2">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Admit Card Generator</h3>
              <p className="text-xs text-gray-500">Standalone tool using Admit Cards.html</p>
            </div>
            <a href="/Admit Cards.html" target="_blank" className="btn-primary text-xs flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open Full Screen
            </a>
          </div>
          <iframe src="/Admit Cards.html" className="w-full h-full border-0 rounded-b-lg"></iframe>
        </div>
      )}

      {/* ══ TAB 5: PROGRESS CARD ══ */}
      {activeTab === 'progress-card' && (
        <div className="card p-2 h-[80vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 mb-2">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Progress Card Generator</h3>
              <p className="text-xs text-gray-500">Standalone tool using JEE Mains Result card with Reports.html</p>
            </div>
            <a href="/JEE Mains Result card with Reports.html" target="_blank" className="btn-primary text-xs flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open Full Screen
            </a>
          </div>
          <iframe src="/JEE Mains Result card with Reports.html" className="w-full h-full border-0 rounded-b-lg"></iframe>
        </div>
      )}

      {/* ══ TAB 6: SLIP TESTS ══ */}
      {activeTab === 'online-exams' && (
        <div className="card p-2 h-[80vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 mb-2">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Slip Test Result Card</h3>
              <p className="text-xs text-gray-500">Standalone tool using Slip Test Result Card.html</p>
            </div>
            <a href="/Slip Test Result Card.html" target="_blank" className="btn-primary text-xs flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open Full Screen
            </a>
          </div>
          <iframe src="/Slip Test Result Card.html" className="w-full h-full border-0 rounded-b-lg"></iframe>
        </div>
      )}

      {/* ══ TAB 7: QUESTION GROUP ══ */}
      {activeTab === 'question-group' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Manage Question Categories & Chapters</span>
            <button onClick={() => setShowGroupModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
              <Plus className="w-4 h-4" /> Add Question Group
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionGroups.map(group => (
              <div key={group.id} className="card p-6 space-y-4 hover:shadow-md transition-shadow relative group border-l-4 border-indigo-500">
                <div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white">{group.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{group.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <span>Questions in group: {group._count?.questions || 0}</span>
                  <button onClick={() => handleDeleteGroup(group.id)} className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showGroupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">New Question Group</h3>
                  <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="label">Group Name</label>
                    <input type="text" required placeholder="e.g. Physics Chapter 1" value={groupName} onChange={e => setGroupName(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea rows={3} placeholder="Describe the topics covered..." value={groupDesc} onChange={e => setGroupDesc(e.target.value)} className="input" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowGroupModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Create Group</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 4: QUESTION BANK ══ */}
      {activeTab === 'question-bank' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold uppercase text-gray-400">Select Group:</span>
              <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold">
                {questionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            {selectedGroupId && (
              <button onClick={() => setShowQuestionModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Create Question
              </button>
            )}
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => {
              const opts = q.options ? JSON.parse(q.options) : [];
              return (
                <div key={q.id} className="card p-6 space-y-4 relative group border-l-4 border-indigo-500">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-950 dark:text-white">Q{index + 1}. {q.questionText}</h4>
                      <div className="flex items-center gap-2.5 mt-2">
                        <span className="text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 px-2 py-0.5 rounded-md">{q.questionType}</span>
                        <span className="text-[10px] font-semibold text-gray-400">Marks: {q.marks}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-405 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {q.questionType === 'MCQ' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1.5">
                      {opts.map((opt: string, optIdx: number) => {
                        const correct = q.correctAnswer === String(optIdx);
                        return (
                          <div key={optIdx} className={`p-3 rounded-xl border font-semibold ${correct ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-gray-150 dark:border-gray-800 text-gray-600'}`}>
                            {optIdx + 1}. {opt} {correct && ' (Correct Answer)'}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === 'SUBJECTIVE' && (
                    <div className="text-xs bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-150 dark:border-gray-800">
                      <span className="text-[10px] font-bold text-gray-405 block uppercase tracking-wider mb-1">Expected Key Phrases/Answers:</span>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">{q.correctAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {questions.length === 0 && (
              <div className="card p-12 text-center text-gray-400">
                No questions defined inside this group. Add question elements to populate the exam staged database bank.
              </div>
            )}
          </div>

          {showQuestionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Add Question to Bank</h3>
                  <button onClick={() => setShowQuestionModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div>
                    <label className="label">Question Type</label>
                    <select value={qType} onChange={e => setQType(e.target.value)} className="input">
                      <option value="MCQ">Multiple Choice Question (MCQ)</option>
                      <option value="SUBJECTIVE">Subjective Answer</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Question Text</label>
                    <textarea rows={3} required placeholder="e.g. What is the value of gravitational constant G?" value={qText} onChange={e => setQText(e.target.value)} className="input" />
                  </div>

                  {qType === 'MCQ' ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-gray-500">Provide 4 Answer Options:</span>
                      <div className="grid grid-cols-2 gap-3">
                        {qOptions.map((opt, optIdx) => (
                          <input key={optIdx} type="text" required placeholder={`Option ${optIdx + 1}`} value={opt} onChange={e => {
                            const updated = [...qOptions];
                            updated[optIdx] = e.target.value;
                            setQOptions(updated);
                          }} className="input" />
                        ))}
                      </div>
                      <div>
                        <label className="label">Select Correct Option Number</label>
                        <select value={qCorrect} onChange={e => setQCorrect(e.target.value)} className="input">
                          <option value="0">Option 1</option>
                          <option value="1">Option 2</option>
                          <option value="2">Option 3</option>
                          <option value="3">Option 4</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="label">Correct Answer Key Description</label>
                      <input type="text" required placeholder="Describe key answers phrases..." value={qCorrect} onChange={e => setQCorrect(e.target.value)} className="input" />
                    </div>
                  )}

                  <div>
                    <label className="label">Marks weightage</label>
                    <input type="number" min={1} value={qMarks} onChange={e => setQMarks(Number(e.target.value))} className="input" />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowQuestionModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Save Question</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 5: ADD ONLINE EXAM ══ */}
      {activeTab === 'add-online-exam' && isAdminOrTeacher && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-150 dark:border-gray-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold">Configure Advanced Online Exam</h3>
            <p className="text-xs text-gray-400 mt-1">Configure timed, automated grading online tests from the bank.</p>
          </div>

          <form onSubmit={handleCreateOnlineExam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Exam Title</label>
                <input type="text" required placeholder="e.g. Physics Chapter 1 MCQ Test" value={onlineTitle} onChange={e => setOnlineTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Target Class</label>
                <select required value={onlineClassId} onChange={e => setOnlineClassId(e.target.value)} className="input">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Subject</label>
                <select required value={onlineSubjectId} onChange={e => setOnlineSubjectId(e.target.value)} className="input">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input type="number" required value={onlineDuration} onChange={e => setOnlineDuration(Number(e.target.value))} className="input" />
              </div>
              <div>
                <label className="label">Passing Marks</label>
                <input type="number" required value={onlinePassMarks} onChange={e => setOnlinePassMarks(Number(e.target.value))} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Start Schedule Time</label>
                <input type="datetime-local" value={onlineStart} onChange={e => setOnlineStart(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">End Schedule Time</label>
                <input type="datetime-local" value={onlineEnd} onChange={e => setOnlineEnd(e.target.value)} className="input" />
              </div>
            </div>

            {/* Select questions */}
            <div className="space-y-3 pt-3 border-t border-gray-150 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-500">Pick Staged Questions to Include in Exam:</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Filter Question Group:</span>
                <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-bold">
                  {questionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                {questions.map(q => {
                  const checked = selectedQIds.includes(q.id);
                  return (
                    <label key={q.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer select-none">
                      <input type="checkbox" checked={checked} onChange={() => {
                        if (checked) {
                          setSelectedQIds(selectedQIds.filter(id => id !== q.id));
                        } else {
                          setSelectedQIds([...selectedQIds, q.id]);
                        }
                      }} className="mt-1" />
                      <div className="text-xs">
                        <p className="font-bold text-gray-800 dark:text-gray-200">{q.questionText}</p>
                        <span className="text-[10px] text-gray-400 font-semibold">{q.questionType} · Marks: {q.marks}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Publish Online Exam
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ TAB 8: QUESTION PAPERS (UPLOAD/DOWNLOAD) ══ */}
      {activeTab === 'question-papers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Manage Question Papers</span>
            {(isAdmin || isTeacher) && (
              <button onClick={() => setShowQpModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Upload Paper
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionPapers.map(qp => (
              <div key={qp.id} className="card p-6 space-y-4 hover:shadow-md relative group border-t-4 border-emerald-500">
                <div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white">{qp.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">Class: {qp.class?.name}-{qp.class?.section} | Subject: {qp.subject?.name}</p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <a href={qp.fileUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 text-center text-xs flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> View/Download
                  </a>
                  {(isAdmin || isTeacher) && (
                    <button onClick={() => handleDeleteQp(qp.id)} className="p-2 border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {questionPapers.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No question papers uploaded yet.
              </div>
            )}
          </div>

          {showQpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Upload Question Paper</h3>
                  <button onClick={() => setShowQpModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateQp} className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input type="text" required placeholder="e.g. Mid Term Physics Paper" value={qpTitle} onChange={e => setQpTitle(e.target.value)} className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Class</label>
                      <select required value={qpClassId} onChange={e => setQpClassId(e.target.value)} className="input">
                        <option value="">Select...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Subject</label>
                      <select required value={qpSubjectId} onChange={e => setQpSubjectId(e.target.value)} className="input">
                        <option value="">Select...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">File URL (PDF/Word)</label>
                    <input type="url" required placeholder="https://link-to-file.pdf" value={qpFileUrl} onChange={e => setQpFileUrl(e.target.value)} className="input" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowQpModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Upload Paper</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 10: SLIP TESTS ══ */}
      {activeTab === 'slip-tests' && (
        <SlipTestsTab />
      )}

      {/* ══ TAB 9: ONLINE EXAMS LIST ══ */}
      {activeTab === 'online-exams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {onlineExams.map(exam => (
              <div key={exam.id} className="card p-6 space-y-4 hover:shadow-md border-t-4 border-indigo-500">
                <div>
                  <Badge variant="success">{exam.subject?.name}</Badge>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white mt-1.5">{exam.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">Class: {exam.class?.name}-{exam.class?.section}</p>
                </div>

                <div className="text-xs space-y-2 text-gray-500 font-semibold border-y border-gray-100 dark:border-gray-800 py-3">
                  <p className="flex justify-between"><span>Duration:</span> <span>{exam.duration} mins</span></p>
                  <p className="flex justify-between"><span>Total Marks:</span> <span>{exam.totalMarks}</span></p>
                  <p className="flex justify-between"><span>Passing Marks:</span> <span>{exam.passMarks}</span></p>
                  <p className="flex justify-between"><span>Questions:</span> <span>{exam.questions?.length || 0} items</span></p>
                </div>

                {isStudent ? (
                  <button onClick={() => handleStartTakeExam(exam.id)} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> Start Exam
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleViewSubmissions(exam.id)} className="btn-secondary flex-1 text-xs font-bold">
                      Submissions ({exam.submissions?.length || 0})
                    </button>
                    <button onClick={() => handleDeleteOnlineExam(exam.id)} className="p-2 border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {onlineExams.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No active online exams scheduled or published.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB 7: WRITTEN EXAM ══ */}
      {activeTab === 'written-exam' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Conventional Offline Written Tests Log</span>
          </div>

          <div className="card p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Exam Title</th>
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Target Class</th>
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Term</th>
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Date</th>
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {exams.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">{e.name}</td>
                      <td className="p-3.5 text-xs font-semibold text-gray-600">{e.class?.name}-{e.class?.section}</td>
                      <td className="p-3.5 text-xs text-gray-450 font-bold">{e.term}</td>
                      <td className="p-3.5 text-xs text-gray-500 font-semibold">{new Date(e.examDate).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right">
                        <Link to={`/exams/${e.id}/entry`} className="btn-secondary text-[11px] font-bold px-3 py-1.5">
                          Enter Grades
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 8: SETTINGS ══ */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-150 dark:border-gray-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold">General Examinations & Grading Setup</h3>
            <p className="text-xs text-gray-400 mt-1">Configure conversion scales, grade keys, and CCE settings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Grading Standards</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Evaluation Mode</label>
                  <select className="input" defaultValue="PERCENTAGE">
                    <option value="CCE">CCE Grading System</option>
                    <option value="GPA">GPA Conversion Scale</option>
                    <option value="PERCENTAGE">Direct Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="label">Default Pass Percentage</label>
                  <input type="number" defaultValue="40" className="input" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Audit Security Log</span>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                Security logging is active. Grade entries, online test attempts, and exam schedules are tracked for student auditing automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ NEW TABS (PLACEHOLDERS) ══ */}
      {activeTab === 'admit-card' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-150 dark:border-gray-800" style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 border-b border-indigo-100 dark:border-indigo-800/50 flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Admit Card Generator Tool</span>
            <a href="/Admit%20Cards.html" target="_blank" rel="noreferrer" className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
              Open in Full Screen <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
          </div>
          <iframe src="/Admit%20Cards.html" className="w-full h-full border-0" title="Admit Cards Generator" />
        </div>
      )}
      
      {activeTab === 'results' && (
        <div className="bg-white dark:bg-gray-900 p-12 text-center rounded-xl border border-gray-150 dark:border-gray-800 space-y-4">
          <Award className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Results Publishing</h3>
          <p className="text-sm text-gray-500">Publish verified results and rank lists (Coming Soon).</p>
        </div>
      )}

      {activeTab === 'progress-card' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-150 dark:border-gray-800" style={{ height: 'calc(100vh - 180px)', minHeight: '600px' }}>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-100 dark:border-blue-800/50 flex justify-between items-center">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Progress Cards & Reports Generator</span>
            <a href="/JEE%20Mains%20Result%20card%20with%20Reports.html" target="_blank" rel="noreferrer" className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              Open in Full Screen <ExternalLink className="w-3 h-3 inline ml-1" />
            </a>
          </div>
          <iframe src="/JEE%20Mains%20Result%20card%20with%20Reports.html" className="w-full h-full border-0" title="Progress Cards Generator" />
        </div>
      )}
    </div>
  );
};

export default ExamListPage;
